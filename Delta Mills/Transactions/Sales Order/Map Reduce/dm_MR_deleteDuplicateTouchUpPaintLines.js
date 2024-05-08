/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: dm_MR_deleteDuplicateTouchUpPaintLines.js
 * Script:
 * Author           Date       Version               Remarks
 * mikewilliams  01.19.2023    1.00        Initial Creation of Script.
 */

/* global define,log*/

define(['N/record', 'N/search'], (record, search) => {
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
        ['item', 'anyof', '1046'],
        'AND',
        ['closed', 'is', 'T'],
        'AND',
        ['custbody_dm_touchup_processed', 'is', 'T'],
      ],
      columns: [
        search.createColumn({
          name: 'lineuniquekey',
          label: 'Line Unique Key',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------------- Map - Begin ------------------------------ */
  const map = (mapContext) => {
    const strLoggerTitle = 'Map Phase';
    log.debug(strLoggerTitle, '-------------<< Map - Entry >>-------------');
    try {
      // Read & parse the data
      const key = mapContext.key;
      const searchResult = JSON.parse(mapContext.value);
      log.debug(strLoggerTitle + ' After Parsing Results', [key, searchResult]);
      mapContext.write({
        key: key,
        value: parseInt(searchResult.values.lineuniquekey),
      });
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
    log.debug(strLoggerTitle, '-------------<< Map - Exit >>-------------');
  };
  /* -------------------------------- Map - End ------------------------------- */
  //
  /* ----------------------------- Reduce - Begin ----------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    log.debug(
      strLoggerTitle,
      '-------------<< Reduce  - Entry >>-------------'
    );
    try {
      const key = reduceContext.key;
      const resultsLength = reduceContext.values.length;

      const soRec = record.load({
        type: record.Type.SALES_ORDER,
        id: key,
        isDynamic: false,
      });

      for (let index = 0; index < resultsLength; index++) {
        // Each Result
        const result = JSON.parse(reduceContext.values[index]);
        log.debug(strLoggerTitle, [key, result]);
        //
        // Find sublist With Line ID
        const duplicateLineNumber = soRec.findSublistLineWithValue({
          sublistId: 'item',
          fieldId: 'lineuniquekey',
          value: result,
        });
        log.debug(
          strLoggerTitle,
          'Duplicate Line Number: ' + duplicateLineNumber
        );
        //
        // Remove the Line
        if (duplicateLineNumber !== -1) {
          soRec.removeLine({
            sublistId: 'item',
            line: duplicateLineNumber,
            ignoreRecalc: true,
          });
          log.debug(strLoggerTitle, 'Duplicate line found and removed');
        }
        //
      }
      soRec.save();
      log.debug(strLoggerTitle, 'Record Saved Successfully');
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
    log.debug(strLoggerTitle, '-------------<< Reduce  - Exit >>-------------');
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
