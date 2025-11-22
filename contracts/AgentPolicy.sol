// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FlexCreditCore.sol";

/**
 * @title AgentPolicy
 * @notice Manages AI agent spending policies and limits based on risk tiers
 * @dev Integrates with FlexCreditCore to enforce agent spending rules
 */
contract AgentPolicy {
    // ============ Structs ============
    
    struct Policy {
        uint256 dailyLimit;      // Max daily spending in USDC (6 decimals)
        uint256 perTxLimit;      // Max per-transaction in USDC (6 decimals)
        bool canUseCredit;       // Can agent use credit line?
        uint256 dailySpent;      // Amount spent today
        uint256 lastResetDay;    // Last day counter was reset
    }
    
    // Risk tiers based on performance
    enum RiskTier {
        UNVERIFIED,  // No verification yet
        RISKY,       // Negative PnL (-1)
        NEUTRAL,     // Neutral PnL (0)
        TRUSTED      // Positive PnL (+1)
    }
    
    // ============ State Variables ============
    
    FlexCreditCore public creditCore;
    address public owner;
    
    // user => agentId => Policy
    mapping(address => mapping(bytes32 => Policy)) public policies;
    
    // user => agentId => RiskTier
    mapping(address => mapping(bytes32 => RiskTier)) public agentTiers;
    
    // Authorized executors (contracts that can execute agent payments)
    mapping(address => bool) public authorizedExecutors;
    
    // Default limits per tier (in USDC, 6 decimals)
    mapping(RiskTier => uint256) public defaultDailyLimits;
    mapping(RiskTier => uint256) public defaultPerTxLimits;
    
    // ============ Events ============
    
    event PolicySet(
        address indexed user,
        bytes32 indexed agentId,
        uint256 dailyLimit,
        uint256 perTxLimit,
        bool canUseCredit
    );
    
    event AgentTierUpgraded(
        address indexed user,
        bytes32 indexed agentId,
        RiskTier oldTier,
        RiskTier newTier
    );
    
    event AgentPaymentExecuted(
        address indexed user,
        bytes32 indexed agentId,
        address to,
        uint256 amount
    );
    
    // ============ Constructor ============
    
    constructor(address _creditCore) {
        creditCore = FlexCreditCore(_creditCore);
        owner = msg.sender;
        
        // Set default limits per tier
        defaultDailyLimits[RiskTier.UNVERIFIED] = 10 * 1e6;    // $10/day
        defaultDailyLimits[RiskTier.RISKY] = 50 * 1e6;        // $50/day
        defaultDailyLimits[RiskTier.NEUTRAL] = 200 * 1e6;     // $200/day
        defaultDailyLimits[RiskTier.TRUSTED] = 1000 * 1e6;    // $1000/day
        
        defaultPerTxLimits[RiskTier.UNVERIFIED] = 5 * 1e6;    // $5/tx
        defaultPerTxLimits[RiskTier.RISKY] = 20 * 1e6;        // $20/tx
        defaultPerTxLimits[RiskTier.NEUTRAL] = 100 * 1e6;     // $100/tx
        defaultPerTxLimits[RiskTier.TRUSTED] = 500 * 1e6;     // $500/tx
    }
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyAuthorizedExecutor() {
        require(authorizedExecutors[msg.sender], "Not authorized executor");
        _;
    }
    
    // ============ Admin Functions ============
    
    function authorizeExecutor(address executor, bool authorized) external onlyOwner {
        authorizedExecutors[executor] = authorized;
    }
    
    function setDefaultLimits(
        RiskTier tier,
        uint256 dailyLimit,
        uint256 perTxLimit
    ) external onlyOwner {
        defaultDailyLimits[tier] = dailyLimit;
        defaultPerTxLimits[tier] = perTxLimit;
    }
    
    // ============ Policy Management ============
    
    /**
     * @notice Set custom policy for an agent
     */
    function setPolicy(
        bytes32 agentId,
        uint256 dailyLimit,
        uint256 perTxLimit,
        bool canUseCredit
    ) external {
        policies[msg.sender][agentId] = Policy({
            dailyLimit: dailyLimit,
            perTxLimit: perTxLimit,
            canUseCredit: canUseCredit,
            dailySpent: 0,
            lastResetDay: block.timestamp / 1 days
        });
        
        emit PolicySet(msg.sender, agentId, dailyLimit, perTxLimit, canUseCredit);
    }
    
    /**
     * @notice Upgrade agent tier based on verified performance
     * @dev Called by AgentPerformanceVerifier after proof verification
     */
    function upgradeAgentTier(
        address user,
        bytes32 agentId,
        int256 riskScore
    ) external {
        // Allow owner or verifier contracts to upgrade
        require(
            msg.sender == owner || 
            msg.sender == address(creditCore) ||
            authorizedExecutors[msg.sender],
            "Not authorized"
        );
        
        RiskTier oldTier = agentTiers[user][agentId];
        RiskTier newTier;
        
        // Map risk score to tier
        if (riskScore == -1) {
            newTier = RiskTier.RISKY;
        } else if (riskScore == 0) {
            newTier = RiskTier.NEUTRAL;
        } else if (riskScore == 1) {
            newTier = RiskTier.TRUSTED;
        } else {
            newTier = RiskTier.UNVERIFIED;
        }
        
        agentTiers[user][agentId] = newTier;
        
        // Update policy limits based on new tier
        Policy storage policy = policies[user][agentId];
        policy.dailyLimit = defaultDailyLimits[newTier];
        policy.perTxLimit = defaultPerTxLimits[newTier];
        policy.canUseCredit = (newTier == RiskTier.NEUTRAL || newTier == RiskTier.TRUSTED);
        
        emit AgentTierUpgraded(user, agentId, oldTier, newTier);
        emit PolicySet(user, agentId, policy.dailyLimit, policy.perTxLimit, policy.canUseCredit);
    }
    
    /**
     * @notice Execute agent payment with policy enforcement
     */
    function executeAgentPayment(
        bytes32 agentId,
        uint256 amount,
        address to
    ) external returns (bool) {
        Policy storage policy = policies[msg.sender][agentId];
        
        // Reset daily counter if new day
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > policy.lastResetDay) {
            policy.dailySpent = 0;
            policy.lastResetDay = currentDay;
        }
        
        // Check per-tx limit
        require(amount <= policy.perTxLimit, "Exceeds per-tx limit");
        
        // Check daily limit
        require(policy.dailySpent + amount <= policy.dailyLimit, "Exceeds daily limit");
        
        // Update daily spent
        policy.dailySpent += amount;
        
        emit AgentPaymentExecuted(msg.sender, agentId, to, amount);
        
        return true;
    }
    
    // ============ View Functions ============
    
    function getPolicy(address user, bytes32 agentId) 
        external 
        view 
        returns (
            uint256 dailyLimit,
            uint256 perTxLimit,
            bool canUseCredit
        ) 
    {
        Policy memory policy = policies[user][agentId];
        
        // If no custom policy, return defaults based on tier
        if (policy.dailyLimit == 0) {
            RiskTier tier = agentTiers[user][agentId];
            return (
                defaultDailyLimits[tier],
                defaultPerTxLimits[tier],
                tier == RiskTier.NEUTRAL || tier == RiskTier.TRUSTED
            );
        }
        
        return (policy.dailyLimit, policy.perTxLimit, policy.canUseCredit);
    }
    
    function getAgentTier(address user, bytes32 agentId) external view returns (RiskTier) {
        return agentTiers[user][agentId];
    }
    
    function getRemainingDailyLimit(address user, bytes32 agentId) 
        external 
        view 
        returns (uint256) 
    {
        Policy memory policy = policies[user][agentId];
        
        // Reset if new day
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > policy.lastResetDay) {
            return policy.dailyLimit;
        }
        
        if (policy.dailySpent >= policy.dailyLimit) {
            return 0;
        }
        
        return policy.dailyLimit - policy.dailySpent;
    }
}
