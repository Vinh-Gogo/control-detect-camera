import numpy as np


def calculate_precision(true_positives, false_positives):
    if true_positives + false_positives == 0:
        return 0.0
    return true_positives / (true_positives + false_positives)


def calculate_recall(true_positives, false_negatives):
    if true_positives + false_negatives == 0:
        return 0.0
    return true_positives / (true_positives + false_negatives)


def main():
    # Example values
    true_positives = 80
    false_positives = 20
    false_negatives = 10

    precision = calculate_precision(true_positives, false_positives)
    recall = calculate_recall(true_positives, false_negatives)

    print(f'Precision: {precision:.2f}')
    print(f'Recall: {recall:.2f}')


if __name__ == '__main__':
    main()