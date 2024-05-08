/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    const strLoggerTitle = 'Input Phase';
    log.debug(
      strLoggerTitle,
      '-------------<< Input Phase - Entry >>-------------'
    );
    try {
      return search.create({
        type: 'salesorder',
        filters: [
          ['type', 'anyof', 'SalesOrd'],
          'AND',
          [
            ['item', 'anyof', '1046'],
            'AND',
            ['quantityshiprecv', 'equalto', '0'],
          ],
          'AND',
          ['custbody_dm_touchup_processed', 'is', 'T'],
        ],
        columns: [
          search.createColumn({ name: 'tranid', label: 'Document Number' }),
          search.createColumn({ name: 'custbody3', label: 'Project Name' }),
          search.createColumn({
            name: 'custcol_dm_sales_order_notes',
            label: 'Sales Order Notes',
          }),
          search.createColumn({ name: 'entity', label: 'Name' }),
          search.createColumn({ name: 'item', label: 'Item' }),
        ],
      });
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------------- Map - Begin ------------------------------ */
  const map = (mapContext) => {
    const strLoggerTitle = 'Map Phase';
    log.debug(strLoggerTitle, '-------------<< Map - Entry >>-------------');
    //
    try {
      const searchResult = JSON.parse(mapContext.value);
      log.debug(strLoggerTitle + ' After Parsing Results', searchResult);
      //
      const id = mapContext.key;
      const values = {};
      values.finish =
        searchResult.values['custcol_dm_sales_order_notes'].split(',')[0];
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
  /* ----------------------------- Reduce - Begin ----------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    log.debug(strLoggerTitle, '-------------<< Reduce - Entry >>-------------');
    //
    try {
      // Read Key
      const soInternalId = reduceContext.key;
      log.debug(strLoggerTitle + ' Reduce SO Key', soInternalId);
      const soRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: soInternalId,
      });
      log.audit(
        strLoggerTitle + ' Sales Order Transaction Status',
        'Sales Order Loaded Successfully'
      );
      //
      // Read Values
      const values = JSON.parse(reduceContext.values[0]);
      log.debug(strLoggerTitle + ' Reduce Values', values);
      //
      // Read Counts
      let soLineCount = soRecord.getLineCount({ sublistId: 'item' });

      for (let index = 0; index < soLineCount; index++) {
        soRecord.setSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_wood_finish',
          line: index,
          value: values.finish,
        });
      }
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
  /* ------------------------------ Reduce - End ------------------------------ */
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
  /* ------------------------- Exports - Begin ------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------- Exports - End ------------------------- */
});
