import React, { useState, useEffect, forwardRef } from "react";
import { StockService } from "../services/StockService";
import MaterialTable, { Column, Icons } from "material-table";
import AddIcon from "@material-ui/icons/Add";
import AddBox from "@material-ui/icons/AddBox";
import ArrowUpward from "@material-ui/icons/ArrowUpward";
import Check from "@material-ui/icons/Check";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";
import Clear from "@material-ui/icons/Clear";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import Edit from "@material-ui/icons/Edit";
import FilterList from "@material-ui/icons/FilterList";
import FirstPage from "@material-ui/icons/FirstPage";
import LastPage from "@material-ui/icons/LastPage";
import Remove from "@material-ui/icons/Remove";
import SaveAlt from "@material-ui/icons/SaveAlt";
import Search from "@material-ui/icons/Search";
import ViewColumn from "@material-ui/icons/ViewColumn";
import { MainFormatter } from "../formatters/MainFormatter";
import { UserStockDataService } from "../services/UserStockDataService";
import SearchAutocomplete from "./SearchAutocomplete";

const tableIcons: Icons = {
  Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
  DetailPanel: forwardRef((props, ref) => (
    <ChevronRight {...props} ref={ref} />
  )),
  Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
  Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
  Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
  FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
  LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
  NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
  PreviousPage: forwardRef((props, ref) => (
    <ChevronLeft {...props} ref={ref} />
  )),
  ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
  SortArrow: forwardRef((props, ref) => <ArrowUpward {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
  ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />),
};

interface TableState {
  columns: Array<Column<any>>;
  data: Array<any>;
}

interface StockCode {
  code: string;
}

interface StockOption {
  symbol: string;
}

const buildStockChangePercentCellStyle = (rowData: any) => {
  if (!rowData || !rowData.regularMarketChangePercent) {
    return {};
  }
  const value = rowData.regularMarketChangePercent;
  if (value > 0) {
    return { color: "green" };
  }
  if (value < 0) {
    return { color: "red" };
  }
  return {};
};

const cellStyle = {
}

const StocksTable: React.FC = () => {
  const [stocksCode, setStocksCode] = useState<StockCode[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<StockOption | null>(
    null
  );
  const [tableShouldBeLoaded, setTableShouldBeLoaded] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableState, setTableState] = useState<TableState>({
    columns: [
      {
        title: "Código",
        field: "symbol",
        type: "string",
        cellStyle,
        editComponent: (props) => (
          <SearchAutocomplete
            onSelectedOptionChange={(e: any, value: StockOption | null) =>
              setSelectedValue(value)
            }
          />
        ),
      },
      {
        title: "Variação (%)",
        field: "regularMarketChangePercent",
        type: "numeric",
        editable: "never",
        cellStyle,
        render: (rowData) => (
          <a style={buildStockChangePercentCellStyle(rowData)}>
            {MainFormatter.formatDecimalValue(
              rowData ? rowData.regularMarketChangePercent : ""
            )}
          </a>
        ),
      },
      {
        title: "Valor de Mercado (R$)",
        field: "regularMarketPrice",
        type: "numeric",
        editable: "never",
        cellStyle,
        render: (rowData) =>
          MainFormatter.formatDecimalValue(
            rowData ? rowData.regularMarketPrice : ""
          ),
      },
      {
        title: "Dividend Yield (%)",
        field: "dividendYield",
        type: "numeric",
        editable: "never",
        cellStyle,
        render: (rowData) =>
          MainFormatter.formatDecimalValue(
            rowData ? rowData.dividendYield : ""
          ),
      },
      {
        title: "Dividend Yield Passado Anual (%)",
        field: "trailingAnnualDividendYield",
        type: "numeric",
        editable: "never",
        cellStyle,
        render: (rowData) =>
          MainFormatter.formatPercentValue(
            rowData ? rowData.trailingAnnualDividendYield : ""
          ),
      },
      {
        title: "P/L Passado",
        field: "trailingPE",
        type: "numeric",
        editable: "never",
        cellStyle,
        render: (rowData) =>
          MainFormatter.formatDecimalValue(rowData ? rowData.trailingPE : ""),
      },
      {
        title: "P/L Futuro",
        field: "forwardPE",
        type: "numeric",
        editable: "never",
        cellStyle,
        render: (rowData) =>
          MainFormatter.formatDecimalValue(rowData ? rowData.forwardPE : ""),
      },
      {
        title: "ROA (%)",
        field: "returnOnAssets",
        type: "numeric",
        editable: "never",
        cellStyle,
        render: (rowData) =>
          MainFormatter.formatPercentValue(
            rowData ? rowData.returnOnAssets : ""
          ),
      },
      {
        title: "ROE (%)",
        field: "returnOnEquity",
        type: "numeric",
        editable: "never",
        cellStyle,
        render: (rowData) =>
          MainFormatter.formatPercentValue(
            rowData ? rowData.returnOnEquity : ""
          ),
      },
    ],
    data: [],
  });

  async function fetchUserStocksCode(): Promise<StockCode[]> {
    const stocksCode = (await UserStockDataService.GetUserStockCodes()) as StockCode[];
    setStocksCode(stocksCode);
    return stocksCode;
  }

  async function fetchStocks(): Promise<any> {
    const stocksCode = await fetchUserStocksCode();
    const stocksDataPromises: Promise<StockCode>[] = stocksCode.map(
      async (stockCode) => {
        return await StockService.getStockMainInfo(stockCode.code);
      }
    );
    return Promise.all(stocksDataPromises).then((stocksData) => {
      return stocksData.filter((stockInfo) => {
        return stockInfo;
      });
    });
  }

  async function fetchStockInfo(stockCode: string): Promise<any> {
    const stockInfo = await StockService.getStockMainInfo(stockCode);
    setTableState((prevState) => {
      return { ...prevState, data: stockInfo };
    });
    return stockInfo;
  }

  const saveStockInfoItem = async (stockInfoItem: any): Promise<void> => {
    if (selectedValue && !isStockCodeAlreadyInTable(selectedValue.symbol)) {
      await UserStockDataService.addUserStockCode(selectedValue.symbol);
      setTableShouldBeLoaded(true);
    }
  };

  const deleteStockInfoItem = async (oldStockInfoItem: any): Promise<void> => {
    if (oldStockInfoItem.symbol) {
      await UserStockDataService.removeStockCodeFromUser(
        oldStockInfoItem.symbol
      );
      setTableShouldBeLoaded(true);
    }
  };

  const isStockCodeAlreadyInTable = (stockCode: string): boolean => {
    return Boolean(getStockInfoInTable(stockCode.toUpperCase()));
  };

  const getStockInfoInTable = (stockCode: string): any => {
    return stocksCode.find((code) => {
      return stockCode.includes(code.code);
    });
  };

  useEffect(() => {
    const test = async () => {
      setIsTableLoading(true);
      const data = await fetchStocks();
      setTableState((prevState) => {
        return { ...prevState, data };
      });
      setIsTableLoading(false);
      setTableShouldBeLoaded(false);
    }
    if (tableShouldBeLoaded) {
      test();
    }
  }, [tableShouldBeLoaded])

  return (
    <div className="MaterialTable-div">
      <MaterialTable
        style={{
          backgroundColor: '#2A2A2A',
          color: '#FFF'
        }}
        options={{
          paging: false,
          actionsCellStyle: {
            color: '#AAA',
          }
        }}
        isLoading={isTableLoading}
        icons={tableIcons}
        title="Ações"
        columns={tableState.columns}
        data={tableState.data}
        editable={{
          onRowAdd: (newData) => {
            return saveStockInfoItem(newData);
          },
          onRowDelete: (oldData) => {
            return deleteStockInfoItem(oldData);
          },
        }}
      />
    </div>
  );
};

export default StocksTable;
