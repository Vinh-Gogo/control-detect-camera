import numpy as np

# Mean Reciprocal Rank (MRR)
def mean_reciprocal_rank(rankings):
    return np.mean([1.0 / (rank + 1) for rank in rankings])

# Example usage of MRR
rankings_example = [0, 1, 2, 1]  # Example rankings
mrr_example = mean_reciprocal_rank(rankings_example)
print('Mean Reciprocal Rank (MRR):', mrr_example)

# Normalized Discounted Cumulative Gain (NDCG)
def dcg_at_k(ranked_list, k):
    return sum((2**rel - 1) / np.log2(idx + 2) 
               for idx, rel in enumerate(ranked_list) if idx < k)


def idcg_at_k(ranked_list, k):
    sorted_relevance = sorted(ranked_list, reverse=True)
    return dcg_at_k(sorted_relevance, k)


def ndcg_at_k(ranked_list, k):
    if not ranked_list:
        return 0.0
    return dcg_at_k(ranked_list, k) / idcg_at_k(ranked_list, k)

# Example usage of NDCG
relevance_example = [3, 2, 3, 0, 1, 2]  # Relevance ratings
ndcg_example = ndcg_at_k(relevance_example, 3)
print('Normalized Discounted Cumulative Gain (NDCG):', ndcg_example)
