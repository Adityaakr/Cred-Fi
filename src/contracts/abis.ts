/**
 * Contract ABIs for FLEX + Vouch/vlayer Integration
 */

export const FlexCreditCoreABI = [
  'function getCreditInfo(address user) view returns (uint256 income, uint256 limit, uint256 used, uint256 available)',
  'function incomeScore(address user) view returns (uint256)',
  'function creditLimit(address user) view returns (uint256)',
  'function usedCredit(address user) view returns (uint256)',
  'function getAvailableCredit(address user) view returns (uint256)',
  'function applyIncomeScore(address user, uint256 incomeBucket) external',
  'function applyAgentPerformance(address user, bytes32 agentId, int256 pnlBucket) external',
];

export const IncomeProofVerifierABI = [
  'function submitIncomeProofSimplified(address user, uint256 incomeBucket, bytes32 proofHash) external',
  'function submitIncomeProof(bytes calldata proof, bytes calldata publicInputs) external',
  'function isProofProcessed(bytes32 proofHash) view returns (bool)',
];

export const AgentPerformanceVerifierABI = [
  'function submitAgentProofSimplified(address user, bytes32 agentId, int256 pnlBucket, bytes32 proofHash) external',
  'function submitAgentProof(bytes calldata proof, bytes calldata publicInputs) external',
  'function isProofProcessed(bytes32 proofHash) view returns (bool)',
];

export const AgentPolicyABI = [
  'function getPolicy(address user, bytes32 agentId) view returns (uint256 dailyLimit, uint256 perTxLimit, bool canUseCredit)',
  'function getAgentTier(address user, bytes32 agentId) view returns (uint8)',
  'function getRemainingDailyLimit(address user, bytes32 agentId) view returns (uint256)',
];

// Contract addresses from deployment
export const CONTRACTS = {
  FlexCreditCore: process.env.NEXT_PUBLIC_FLEX_CREDIT_CORE || '0x239f6Dfd77c4D5FF3017daAD4d3D3cD8758Cc030',
  AgentPolicy: process.env.NEXT_PUBLIC_AGENT_POLICY || '0x6b7FD37c4325a2196B77BaD67F570F8f6544C37E',
  IncomeProofVerifier: process.env.NEXT_PUBLIC_INCOME_VERIFIER || '0x8b00dEE5209e73F1D92bE834223D3497c57b4263',
  AgentPerformanceVerifier: process.env.NEXT_PUBLIC_AGENT_VERIFIER || '0xe75Fd063e74780B26f38418a424069374c746C49',
};
