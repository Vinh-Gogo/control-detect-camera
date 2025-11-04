# Retrieval Metrics

## Mean Reciprocal Rank (MRR)

**Definition:** MRR is a measure used to evaluate the effectiveness of an information retrieval system, specifically in scenarios where the relevance of a single answer is crucial. It is defined as the average of the reciprocal ranks of the first relevant item.

**Formula:**  
\[ MRR = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{rank_i} \]  
where \( |Q| \) is the total number of queries, and \( rank_i \) is the rank position of the first relevant document for the i-th query.

**Example:**  
For three queries with the first relevant documents ranked at positions 1, 3, and 2:
\[ MRR = \frac{1}{3} \left( 1 + \frac{1}{3} + \frac{1}{2} \right) = \frac{1}{3} (1 + 0.333 + 0.5) = \frac{1.833}{3} = 0.611 \]

## Normalized Discounted Cumulative Gain (NDCG)

**Definition:** NDCG is a measure of ranking quality that evaluates the usefulness of a ranked list of documents based on their relevance.

**Formula:**  
\[ NDCG_k = \frac{DCG_k}{IDCG_k} \]  
where:  
\[ DCG_k = rel_1 + \sum_{i=2}^{k} \frac{rel_i}{\log_2(i)} \]  
\[ IDCG_k = DCG \text{ of the best possible ranking} \]

**Example:**  
Given a ranked result set with relevance scores: [3, 2, 3, 0, 1], we calculate NDCG at k=3:
- DCG for top 3: 3 + \frac{2}{\log_2(2)} + \frac{3}{\log_2(3)} \approx 3 + 2 + 1.585 = 6.585  
- IDCG for top 3 (if perfectly ranked): 3 + 2 + 3 = 8  
Thus:  \[ NDCG_3 = \frac{6.585}{8} = 0.823 \]

## Recall

**Definition:** Recall is the ratio of the number of relevant documents retrieved to the total number of relevant documents available.

**Formula:**  
\[ Recall = \frac{TP}{TP + FN} \]  
where:  
- \( TP \) is True Positive (correctly retrieved relevant documents)  
- \( FN \) is False Negative (relevant documents not retrieved)

**Example:**  
If there are 10 relevant documents in total, and 7 of them are retrieved:  
\[ Recall = \frac{7}{7 + 3} = \frac{7}{10} = 0.7 \]

## Precision

**Definition:** Precision measures the accuracy of the retrieved documents, defined as the ratio of relevant documents retrieved to the total documents retrieved.

**Formula:**  
\[ Precision = \frac{TP}{TP + FP} \]  
where:  
- \( FP \) is False Positive (irrelevant documents retrieved)

**Example:**  
If 10 documents are retrieved in total, and 7 are relevant:  
\[ Precision = \frac{7}{7 + 3} = \frac{7}{10} = 0.7 \]  

---

These metrics provide a comprehensive overview of an information retrieval system's performance, balancing between recall and precision to optimize search results for users.