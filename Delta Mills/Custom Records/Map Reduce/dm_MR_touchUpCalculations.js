/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * Fileanme: dm_MR_touchUpCalculations.js
 * Script: DM | MR Touch Up Calculations
 * Author           Date       Version               Remarks
 * mikewilliams  2022.10.05    1.00        Initial Creation of Script.
 */

/* global define,log*/
define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['custbody_dm_touchup_processed', 'is', 'F'],
        'AND',
        [
          ['custcol_wood_finish', 'isnotempty', ''],
          'AND',
          ['custcol_wood_finish', 'isnot', 'Unfinished'],
        ],
        'AND',
        ['datecreated', 'onorafter', 'today'],
      ],
      columns: [
        search.createColumn({
          name: 'internalid',
          summary: 'GROUP',
          label: 'Internal ID',
        }),
        search.createColumn({
          name: 'quantity',
          summary: 'SUM',
          label: 'Quantity',
        }),
        search.createColumn({
          name: 'custcol_wood_finish',
          summary: 'GROUP',
          label: 'Finish',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------- Map - Begin ------------------------- */
  const map = (mapContext) => {
    const strLoggerTitle = 'Map Phase';
    log.debug(strLoggerTitle, '-------------<< Map - Entry >>-------------');
    //
    try {
      const searchResult = JSON.parse(mapContext.value);
      log.debug(strLoggerTitle + ' After Parsing Results', searchResult);
      //
      const id = searchResult.values['GROUP(internalid)'].value;
      const values = {};
      values.itemFinish = searchResult.values['GROUP(custcol_wood_finish)'];
      values.itemSellQty = searchResult.values['SUM(quantity)'];
      //
      mapContext.write({ key: Number(id), value: values });
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
    //
    log.debug(strLoggerTitle, '-------------<< Map - Exit >>-------------');
  };
  /* ------------------------- Map - End ------------------------- */
  //
  /* ------------------------- Reduce - Begin ------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    let quantityMeasure;
    log.debug(strLoggerTitle, '-------------<< Reduce - Entry >>-------------');
    //
    try {
      // Read Key
      const soInternalId = reduceContext.key;
      log.debug(strLoggerTitle + ' Reduce SO Key', soInternalId);
      const soRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: soInternalId,
        isDynamic: true,
      });
      log.audit(
        strLoggerTitle + ' Sales Order Transaction Status',
        'Sales Order Loaded Successfully'
      );
      //
      // Read Values
      const values = reduceContext.values;
      log.debug(strLoggerTitle + ' Reduce Values', values);
      //
      // Get Touch Up Calculation Results
      const touchUpCalculationsResults = touchUpCalculationsRecords();
      log.debug(
        strLoggerTitle + ' Touch Up Calcualtion Results',
        touchUpCalculationsResults
      );
      //
      // Read Counts
      let soLineCount = soRecord.getLineCount({ sublistId: 'item' });
      //
      /* ------------------------ Loop Thru Values - Begin ------------------------ */
      for (let index = 0; index < values.length; index++) {
        const result = JSON.parse(values[index]);
        log.debug(strLoggerTitle + ' After Parsing Each Result', result);
        const itemQuantity = result.itemSellQty;
        const itemFinish = result.itemFinish;
        soLineCount += 1;
        //
        // Get Quantity Measure
        for (
          let index1 = 0;
          index1 < touchUpCalculationsResults.length;
          index1++
        ) {
          const minQuantity = touchUpCalculationsResults[index1].getValue(
            'custrecord_dm_min_quantity'
          );
          const maxQuantity = touchUpCalculationsResults[index1].getValue(
            'custrecord_dm_max_quantity'
          );
          if (
            Number(itemQuantity) > minQuantity &&
            Number(itemQuantity) < maxQuantity
          ) {
            quantityMeasure = touchUpCalculationsResults[index1].getValue(
              'custrecord_dm_qty_measurements'
            );
            break;
          }
        }
        //
        const itemDescription =
          itemFinish + ', ' + itemQuantity + ', ' + quantityMeasure;
        log.debug(strLoggerTitle + ' Item Description', itemDescription);
        //
        soRecord.selectNewLine({
          sublistId: 'item',
        });
        soRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          value: 933,
        });
        soRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount',
          value: 0,
        });
        soRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          value: 1,
        });
        soRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'description',
          value: itemDescription,
        });
        soRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_dm_sales_order_notes',
          value: itemDescription,
        });
        soRecord.commitLine({ sublistId: 'item' });
      }
      /* ------------------------ Loop Thru Values - End ------------------------ */
      //
      soRecord.setValue({
        fieldId: 'custbody_dm_touchup_processed',
        value: true,
      });
      soRecord.save();
      log.audit(
        strLoggerTitle + ' Sales Order Transaction Status',
        'Sales Order Saved Successfully'
      );
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
    //
    log.debug(strLoggerTitle, '-------------<< Reduce - Exit >>-------------');
  };
  /* ------------------------- Reduce - End ------------------------- */
  //
  /* ------------------------- Summarize - Begin ------------------------- */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
    log.debug(
      strLoggerTitle,
      '-------------<< Summarize - Begin >>-------------'
    );
    try {
      log.audit(
        strLoggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        strLoggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        strLoggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(strLoggerTitle + ' failed to Execute', error);
    }
    log.debug(
      strLoggerTitle,
      '-------------<< Summarize - Exit >>-------------'
    );
  };
  /* ------------------------- Summarize - End ------------------------- */
  //
  /* ----------------------- Internal Functions - Begin ----------------------- */
  //
  /* *********************** getAllSearchResults - Begin *********************** */
  /**
   *
   * @param {string} stRecordType
   * @param {string} stSavedSearch
   * @param {array} arrFilters
   * @param {array} arrColumns
   * @returns {array} array of objects
   */
  const getAllSearchResults = (
    stRecordType,
    stSavedSearch,
    arrFilters,
    arrColumns
  ) => {
    let arrResult = [];
    let searchResults;
    if (stSavedSearch) {
      searchResults = search.load({
        id: stSavedSearch,
        type: stRecordType,
      });
      for (let i = 0; arrColumns != null && i < arrColumns.length; i++) {
        searchResults.columns.push(arrColumns[i]);
      }
      for (let i = 0; arrFilters != null && i < arrFilters.length; i++) {
        searchResults.filters.push(arrFilters[i]);
      }
    } else {
      searchResults = search.create({
        type: stRecordType,
        columns: arrColumns,
        filters: arrFilters,
      });
    }

    let count = 1000;
    let init = true;
    let min = 0;
    let max = 1000;

    while (count === 1000 || init) {
      var resultSet = searchResults.run().getRange({
        start: min,
        end: max,
      });

      arrResult = arrResult.concat(resultSet);
      min = max;
      max += 1000;

      init = false;
      count = resultSet.length;
    }

    return arrResult;
  };
  /* *********************** getAllSearchResults - End *********************** */
  //
  /* *********************** touchUpCalculationsRecords - Begin *********************** */
  const touchUpCalculationsRecords = () => {
    const strLoggerTitle = ' Get Touch Up Calculations Records';
    log.debug(
      strLoggerTitle,
      '-------------<< ' + strLoggerTitle + ' - Entry >>-------------'
    );
    //
    // Filters
    const arrFilters = [];
    arrFilters.push(['isinactive', 'is', 'F']);
    //
    // Columns
    const arrColumns = [];
    arrColumns.push(
      search.createColumn({
        name: 'id',
        sort: search.Sort.ASC,
        label: 'ID',
      })
    );
    arrColumns.push(
      search.createColumn({
        name: 'custrecord_dm_min_quantity',
        label: 'Minimum Quantity',
      })
    );
    arrColumns.push(
      search.createColumn({
        name: 'custrecord_dm_max_quantity',
        label: 'Maximum Quantity',
      })
    );
    arrColumns.push(
      search.createColumn({
        name: 'custrecord_dm_qty_measurements',
        label: 'Quantity Measure',
      })
    );
    //
    // call the search
    const results = getAllSearchResults(
      'customrecord_dm_touchup_paintcalculation',
      null,
      arrFilters,
      arrColumns
    );
    log.debug(strLoggerTitle, 'Length of Results: ' + results.length);
    //
    log.debug(
      strLoggerTitle,
      '-------------<< ' + strLoggerTitle + ' - Exit >>-------------'
    );
    return results;
  };
  /* *********************** touchUpCalculationsRecords - End *********************** */
  //
  /* ----------------------- Internal Functions - End ----------------------- */
  //
  /* ------------------------- Exports - Begin ------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------- Exports - End ------------------------- */
});
