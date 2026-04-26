// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CampaignToken.sol";

interface ICampaignToken {
    function owner() external view returns (address);

    function mint(address to, uint256 amount) external;
}

contract CrowdfundingTokenized is ReentrancyGuard {
    struct Campaign {
        address payable owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string image;
        address token;
        string tokenSymbol;
        string tokenImage;
        uint256 tokensPerEth;
        bool cancelled;
    }

    struct Milestone {
        string title;
        uint256 amount;
        uint256 voteWeight;
        bool released;
    }

    uint256 public numberOfCampaigns;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => address[]) private campaignDonators;
    mapping(uint256 => uint256[]) private campaignDonations;
    mapping(uint256 => Milestone[]) private campaignMilestones;
    mapping(uint256 => mapping(address => uint256)) private contributions;
    mapping(uint256 => mapping(address => bool)) private hasRefunded;
    mapping(uint256 => mapping(uint256 => mapping(address => bool)))
        private hasVoted;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed owner,
        address indexed token
    );
    event DonationReceived(
        uint256 indexed campaignId,
        address indexed investor,
        uint256 amount,
        uint256 mintedTokens
    );
    event CampaignCancelled(uint256 indexed campaignId);
    event Refunded(
        uint256 indexed campaignId,
        address indexed investor,
        uint256 amount
    );
    event MilestoneVoted(
        uint256 indexed campaignId,
        uint256 indexed milestoneId,
        address indexed investor,
        uint256 weight
    );
    event MilestoneReleased(
        uint256 indexed campaignId,
        uint256 indexed milestoneId,
        uint256 amount
    );

    function _createCampaignInternal(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image,
        address _token,
        string memory _tokenSymbol,
        string memory _tokenImage,
        uint256 _tokensPerEth,
        string[] memory _milestoneTitles,
        uint256[] memory _milestoneAmounts
    ) internal returns (uint256) {
        require(_target > 0, "Target must be > 0");
        require(_deadline > block.timestamp, "Deadline must be in future");
        require(_token != address(0), "Invalid token");
        require(bytes(_tokenSymbol).length > 0, "Token symbol required");
        require(bytes(_tokenImage).length > 0, "Token image required");
        require(_tokensPerEth > 0, "Rate must be > 0");
        require(
            _milestoneTitles.length == _milestoneAmounts.length,
            "Milestone mismatch"
        );
        require(_milestoneTitles.length > 0, "At least one milestone required");

        uint256 totalMilestoneAmount;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            require(_milestoneAmounts[i] > 0, "Milestone amount must be > 0");
            totalMilestoneAmount += _milestoneAmounts[i];

            campaignMilestones[numberOfCampaigns].push(
                Milestone({
                    title: _milestoneTitles[i],
                    amount: _milestoneAmounts[i],
                    voteWeight: 0,
                    released: false
                })
            );
        }

        require(totalMilestoneAmount <= _target, "Milestones exceed target");
        require(
            ICampaignToken(_token).owner() == address(this),
            "Token owner must be crowdfunding"
        );

        campaigns[numberOfCampaigns] = Campaign({
            owner: payable(msg.sender),
            title: _title,
            description: _description,
            target: _target,
            deadline: _deadline,
            amountCollected: 0,
            image: _image,
            token: _token,
            tokenSymbol: _tokenSymbol,
            tokenImage: _tokenImage,
            tokensPerEth: _tokensPerEth,
            cancelled: false
        });

        emit CampaignCreated(numberOfCampaigns, msg.sender, _token);
        numberOfCampaigns++;
        return numberOfCampaigns - 1;
    }

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image,
        address _token,
        string memory _tokenSymbol,
        string memory _tokenImage,
        uint256 _tokensPerEth,
        string[] memory _milestoneTitles,
        uint256[] memory _milestoneAmounts
    ) external returns (uint256) {
        return
            _createCampaignInternal(
                _title,
                _description,
                _target,
                _deadline,
                _image,
                _token,
                _tokenSymbol,
                _tokenImage,
                _tokensPerEth,
                _milestoneTitles,
                _milestoneAmounts
            );
    }

    function createCampaignWithToken(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image,
        string memory _tokenName,
        string memory _tokenSymbol,
        string memory _tokenImage,
        uint256 _tokensPerEth,
        string[] memory _milestoneTitles,
        uint256[] memory _milestoneAmounts
    ) external returns (uint256) {
        require(bytes(_tokenName).length > 0, "Token name required");
        require(bytes(_tokenSymbol).length > 0, "Token symbol required");

        CampaignToken token = new CampaignToken(
            _tokenName,
            _tokenSymbol,
            address(this)
        );

        return
            _createCampaignInternal(
                _title,
                _description,
                _target,
                _deadline,
                _image,
                address(token),
                _tokenSymbol,
                _tokenImage,
                _tokensPerEth,
                _milestoneTitles,
                _milestoneAmounts
            );
    }

    function donateToCampaign(uint256 _id) external payable nonReentrant {
        Campaign storage campaign = campaigns[_id];

        require(campaign.owner != address(0), "Campaign not found");
        require(!campaign.cancelled, "Campaign cancelled");
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(msg.value >= 0.01 ether, "Donation must be >= 0.01 ETH");

        campaignDonators[_id].push(msg.sender);
        campaignDonations[_id].push(msg.value);
        contributions[_id][msg.sender] += msg.value;
        campaign.amountCollected += msg.value;
        // If tokensPerEth = 10, then 1 ETH (1e18 wei) mints 10e18 token units.
        uint256 mintedAmount = msg.value * campaign.tokensPerEth;
        ICampaignToken(campaign.token).mint(msg.sender, mintedAmount);

        emit DonationReceived(_id, msg.sender, msg.value, mintedAmount);
    }

    function cancelCampaign(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        require(campaign.owner != address(0), "Campaign not found");
        require(msg.sender == campaign.owner, "Only creator");
        require(!campaign.cancelled, "Already cancelled");
        campaign.cancelled = true;
        emit CampaignCancelled(_id);
    }

    function refund(uint256 _id) external nonReentrant {
        Campaign storage campaign = campaigns[_id];
        uint256 contributed = contributions[_id][msg.sender];
        require(campaign.owner != address(0), "Campaign not found");
        require(campaign.cancelled, "Campaign not cancelled");
        require(contributed > 0, "No contribution");
        require(!hasRefunded[_id][msg.sender], "Already refunded");
        hasRefunded[_id][msg.sender] = true;
        (bool sent, ) = payable(msg.sender).call{value: contributed}("");
        require(sent, "Refund failed");
        emit Refunded(_id, msg.sender, contributed);
    }

    function voteMilestone(uint256 _id, uint256 _milestoneId) external {
        Campaign storage campaign = campaigns[_id];
        require(campaign.owner != address(0), "Campaign not found");
        require(!campaign.cancelled, "Campaign cancelled");
        require(
            _milestoneId < campaignMilestones[_id].length,
            "Invalid milestone"
        );
        require(contributions[_id][msg.sender] > 0, "Only investors can vote");
        require(!hasVoted[_id][_milestoneId][msg.sender], "Already voted");
        Milestone storage milestone = campaignMilestones[_id][_milestoneId];
        require(!milestone.released, "Milestone released");
        hasVoted[_id][_milestoneId][msg.sender] = true;
        uint256 weight = contributions[_id][msg.sender];
        milestone.voteWeight += weight;
        emit MilestoneVoted(_id, _milestoneId, msg.sender, weight);
    }

    function releaseMilestone(
        uint256 _id,
        uint256 _milestoneId
    ) external nonReentrant {
        Campaign storage campaign = campaigns[_id];
        require(campaign.owner != address(0), "Campaign not found");
        require(msg.sender == campaign.owner, "Only creator");
        require(!campaign.cancelled, "Campaign cancelled");
        require(
            _milestoneId < campaignMilestones[_id].length,
            "Invalid milestone"
        );

        Milestone storage milestone = campaignMilestones[_id][_milestoneId];
        require(!milestone.released, "Milestone already released");

        // > 50% of raised capital (weighted by investment) must approve.
        require(
            milestone.voteWeight * 2 > campaign.amountCollected,
            "Not enough votes"
        );
        require(
            address(this).balance >= milestone.amount,
            "Insufficient contract balance"
        );

        milestone.released = true;

        (bool sent, ) = campaign.owner.call{value: milestone.amount}("");
        require(sent, "Milestone transfer failed");

        emit MilestoneReleased(_id, _milestoneId, milestone.amount);
    }

    function getCampaign(
        uint256 _id
    )
        external
        view
        returns (
            address owner,
            string memory title,
            string memory description,
            uint256 target,
            uint256 deadline,
            uint256 amountCollected,
            string memory image,
            address token,
            string memory tokenSymbol,
            string memory tokenImage,
            uint256 tokensPerEth,
            bool cancelled
        )
    {
        Campaign storage campaign = campaigns[_id];
        return (
            campaign.owner,
            campaign.title,
            campaign.description,
            campaign.target,
            campaign.deadline,
            campaign.amountCollected,
            campaign.image,
            campaign.token,
            campaign.tokenSymbol,
            campaign.tokenImage,
            campaign.tokensPerEth,
            campaign.cancelled
        );
    }

    function getCampaigns() external view returns (uint256[] memory ids) {
        ids = new uint256[](numberOfCampaigns);
        for (uint256 i = 0; i < numberOfCampaigns; i++) {
            ids[i] = i;
        }
    }

    function getDonators(
        uint256 _id
    ) external view returns (address[] memory, uint256[] memory) {
        return (campaignDonators[_id], campaignDonations[_id]);
    }

    function getMilestones(
        uint256 _id
    ) external view returns (Milestone[] memory) {
        return campaignMilestones[_id];
    }

    function getInvestorTokenEarnings(
        uint256 _id,
        address _investor
    ) external view returns (uint256) {
        Campaign storage campaign = campaigns[_id];
        require(campaign.owner != address(0), "Campaign not found");
        require(_investor != address(0), "Invalid investor");

        return contributions[_id][_investor] * campaign.tokensPerEth;
    }
}
