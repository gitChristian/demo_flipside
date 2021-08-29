import React, { useState, useEffect } from 'react';
import { getProjectRankMetrics, getTimeseries } from "../api/fcas"
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import { LineChart, Line } from 'recharts';


const useStyles = makeStyles( theme => ({
  table: {
    minWidth: 650,
    "& td": {
      border: `1px solid ${theme.palette.grey[600]}`
    },
    "& th": {
      border: `1px solid ${theme.palette.grey[600]}`
    }     
  },
  container: {
    width: '98%',
    margin: 'auto'
  }, 
  tableHead : {
    backgroundColor: theme.palette.grey[400]
  }
}));

const ExampleJSPage = () => {
  const [metricData, setMetricData] = useState({});
  const classes = useStyles();

  useEffect(() => {
    //fetch all metric data on load
    const metric_promises = [getProjectRankMetrics('fcas'), getProjectRankMetrics('dev'), 
      getProjectRankMetrics('utility') , getProjectRankMetrics('market-maturity')];
    Promise.all( metric_promises )
    .then( response => {
      const table_data = {};
      for (const metric of response){
        for (const metric_row of metric.data.data){
          if( !(metric_row.project_id in table_data) ){
            table_data[ metric_row.project_id ] = {
              'name' : metric_row.project_name,
              'symbol' : metric_row.symbol
            };
          }
          table_data[ metric_row.project_id ][ metric_row.metric_slug ] = metric_row.value;
        }
      }
      createTimeSeriesRequest(table_data);
    })
    .catch( error => {
      alert('Could not get metrics.');
    });
  }, []);

  function createTimeSeriesRequest(table_data) {
    //use previously obtained project ids to query timeseries
    //only get projects with fcas score
    const project_ids = Object.keys(table_data)
      .filter( x => 'fcas' in table_data[x] );

    const now =  new Date().toISOString();
    const thirtyDaysAgo = new Date(new Date().setDate(new Date()
      .getDate() - 30)).toISOString();

    getTimeseries(project_ids, ['fcas'], thirtyDaysAgo, now )
      .then( response => {
        const timeseries = response.data.data;
        for (const project of timeseries){
          table_data[project.project_id]['timeseries'] = 
            project.metrics[0].timeseries;
        }
        setMetricData(table_data);
      });
  }

  return (
    <div>
      <CssBaseline/>
      <TableContainer className={classes.container} component={Paper}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead className={classes.tableHead}>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Symbol</TableCell>
            <TableCell>FCAS Trend</TableCell>
            <TableCell>FCAS</TableCell>
            <TableCell>Dev Behavior</TableCell>
            <TableCell>User Activity</TableCell>
            <TableCell>Market Maturity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          { Object.keys(metricData)
          .sort( (a,b) => metricData[b].fcas - metricData[a].fcas )
          .map( (row) => (
            <TableRow key={row}>
              <TableCell>{metricData[row].name}</TableCell>
              <TableCell>{metricData[row].symbol}</TableCell>
              <TableCell>
                {metricData[row].timeseries && 
                  <LineChart
                    width={150}
                    height={20}
                    data={ metricData[row].timeseries }>
                    <Line type="monotone" dataKey="value" dot={false} stroke="#82ca9d" />
                  </LineChart>
                }
              </TableCell>
              <TableCell>{metricData[row].fcas}</TableCell>
              <TableCell>{metricData[row].dev}</TableCell>
              <TableCell>{metricData[row].utility}</TableCell>
              <TableCell>{metricData[row]['market-maturity']}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </div>
  );
}

export default ExampleJSPage;
