module edk.db.pure.row_decode;

import edk.db.sql.db_null;
import edk.db.types.{CellLookup, DbValue, Row, SqlParam};

public flow cell(name: string, value: DbValue) -> SqlParam ![] {
    return SqlParam { name = name, value = value };
}

public flow missing_cell(name: string) -> SqlParam ![] {
    return cell(name, db_null());
}

public flow lookup_cell(row: Row, name: string) -> CellLookup ![] {
    for item in row.cells limit Iterations(65536) {
        if item.name == name {
            return CellLookup {
                found = true,
                cell = item,
            };
        }
    }
    return CellLookup {
        found = false,
        cell = missing_cell(name),
    };
}

flow count_cells(row: Row) -> i32 ![] {
    var total = 0;
    for item in row.cells limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow get_cell(row: Row, name: string) -> SqlParam ![Error<IndexError>] {
    for item in row.cells limit Iterations(65536) {
        if item.name == name {
            return item;
        }
    }
    return row.cells[count_cells(row)];
}

public flow has_cell(row: Row, name: string) -> bool ![] {
    return lookup_cell(row, name).found;
}
