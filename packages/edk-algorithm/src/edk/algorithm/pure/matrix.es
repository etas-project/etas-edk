module edk.algorithm.pure.matrix;

import edk.algorithm.pure.array_helpers.repeat_i32;

public alias MatrixI32 = {
    rows: i32,
    cols: i32,
    values: Array<i32>,
};

public flow filled(rows: i32, cols: i32, value: i32) -> MatrixI32 ![] {
    return MatrixI32 {
        rows = rows,
        cols = cols,
        values = repeat_i32(value, rows * cols),
    };
}

public flow from_values(rows: i32, cols: i32, values: Array<i32>) -> MatrixI32 ![] {
    return MatrixI32 {
        rows = rows,
        cols = cols,
        values = values,
    };
}

public flow index_of(matrix: MatrixI32, row: i32, col: i32) -> i32 ![] {
    return row * matrix.cols + col;
}

public flow get(matrix: MatrixI32, row: i32, col: i32) -> i32 ![Error<IndexError>] {
    return matrix.values[index_of(matrix, row, col)];
}

public flow set_cell(matrix: MatrixI32, row: i32, col: i32, value: i32) -> MatrixI32 ![Error<IndexError>] {
    var values = matrix.values;
    values[index_of(matrix, row, col)] = value;
    return MatrixI32 {
        rows = matrix.rows,
        cols = matrix.cols,
        values = values,
    };
}

public flow transpose(matrix: MatrixI32) -> MatrixI32 ![Error<IndexError>] {
    var values: Array<i32> = [];
    var col = 0;
    while col < matrix.cols limit Iterations(65536) {
        var row = 0;
        while row < matrix.rows limit Iterations(65536) {
            values = values.push(get(matrix, row, col));
            row = row + 1;
        }
        col = col + 1;
    }
    return MatrixI32 {
        rows = matrix.cols,
        cols = matrix.rows,
        values = values,
    };
}

public flow add(left: MatrixI32, right: MatrixI32) -> MatrixI32 ![Error<IndexError>] {
    var out: Array<i32> = [];
    var i = 0;
    while i < left.rows * left.cols limit Iterations(65536) {
        out = out.push(left.values[i] + right.values[i]);
        i = i + 1;
    }
    return MatrixI32 {
        rows = left.rows,
        cols = left.cols,
        values = out,
    };
}
