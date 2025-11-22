// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FlexCreditCore
 * @notice Core credit management for FLEX - handles human credit limits and agent risk scoring
 * @dev Integrates with Vouch/vlayer proof verifiers for zero-knowledge credit underwriting
 */
contract FlexCreditCore {
    // ============ State Variables ============
    
    // Human credit state
    mapping(address => uint256) public incomeScore;      // Income bucket: 0, 500, 1000, 2000
    mapping(address => uint256) public creditLimit;      // Max borrowing capacity in USDC (6 decimals)
    mapping(address => uint256) public usedCredit;       // Currently borrowed amount
    
    // Agent risk state
    mapping(address => mapping(bytes32 => int256)) public agentRiskScore; // -1, 0, +1 (loss, neutral, profit)
    
    // Credit multiplier: creditLimit = incomeScore * CREDIT_MULTIPLIER
    uint256 public constant CREDIT_MULTIPLIER = 3; // 3x income as credit limit
    
    // Authorized verifiers
    mapping(address => bool) public authorizedVerifiers;
    
    address public owner;
    
    // ============ Events ============
    
    event IncomeScoreApplied(
        address indexed user,
        uint256 previousScore,
        uint256 newScore,
        uint256 newCreditLimit
    );
    
    event AgentPerformanceApplied(
        address indexed user,
        bytes32 indexed agentId,
        int256 previousScore,
        int256 newScore
    );
    
    event CreditUsed(address indexed user, uint256 amount, uint256 totalUsed);
    event CreditRepaid(address indexed user, uint256 amount, uint256 totalUsed);
    event VerifierAuthorized(address indexed verifier, bool authorized);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============ Admin Functions ============
    
    function authorizeVerifier(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierAuthorized(verifier, authorized);
    }
    
    // ============ Core Credit Functions ============
    
    /**
     * @notice Apply verified income score from Vouch proof
     * @param user The user whose income was verified
     * @param incomeBucket Income tier: 0, 500, 1000, 2000 (monthly income in USDC)
     */
    function applyIncomeScore(address user, uint256 incomeBucket) 
        external 
        onlyAuthorizedVerifier 
    {
        require(
            incomeBucket == 0 || 
            incomeBucket == 500 || 
            incomeBucket == 1000 || 
            incomeBucket == 2000,
            "Invalid income bucket"
        );
        
        uint256 previousScore = incomeScore[user];
        incomeScore[user] = incomeBucket;
        
        // Calculate new credit limit: income * multiplier
        uint256 newLimit = incomeBucket * CREDIT_MULTIPLIER * 1e6; // Convert to 6 decimals (USDC)
        creditLimit[user] = newLimit;
        
        emit IncomeScoreApplied(user, previousScore, incomeBucket, newLimit);
    }
    
    /**
     * @notice Apply verified agent performance from Vouch proof
     * @param user The user who owns the agent
     * @param agentId Unique identifier for the agent
     * @param pnlBucket Performance tier: -1 (loss), 0 (neutral), +1 (profit)
     */
    function applyAgentPerformance(
        address user, 
        bytes32 agentId, 
        int256 pnlBucket
    ) 
        external 
        onlyAuthorizedVerifier 
    {
        require(
            pnlBucket == -1 || pnlBucket == 0 || pnlBucket == 1,
            "Invalid PnL bucket"
        );
        
        int256 previousScore = agentRiskScore[user][agentId];
        agentRiskScore[user][agentId] = pnlBucket;
        
        emit AgentPerformanceApplied(user, agentId, previousScore, pnlBucket);
    }
    
    /**
     * @notice Use credit (borrow)
     * @param amount Amount to borrow in USDC (6 decimals)
     */
    function useCredit(uint256 amount) external {
        require(usedCredit[msg.sender] + amount <= creditLimit[msg.sender], "Exceeds credit limit");
        
        usedCredit[msg.sender] += amount;
        emit CreditUsed(msg.sender, amount, usedCredit[msg.sender]);
    }
    
    /**
     * @notice Repay credit
     * @param amount Amount to repay in USDC (6 decimals)
     */
    function repayCredit(uint256 amount) external {
        require(amount <= usedCredit[msg.sender], "Repay exceeds debt");
        
        usedCredit[msg.sender] -= amount;
        emit CreditRepaid(msg.sender, amount, usedCredit[msg.sender]);
    }
    
    // ============ View Functions ============
    
    function getAvailableCredit(address user) external view returns (uint256) {
        return creditLimit[user] - usedCredit[user];
    }
    
    function getCreditInfo(address user) external view returns (
        uint256 income,
        uint256 limit,
        uint256 used,
        uint256 available
    ) {
        income = incomeScore[user];
        limit = creditLimit[user];
        used = usedCredit[user];
        available = limit - used;
    }
    
    function getAgentRisk(address user, bytes32 agentId) external view returns (int256) {
        return agentRiskScore[user][agentId];
    }
}
