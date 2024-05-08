/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: dm_MR_updateMillOrderBuiltFields.js
 * Script:
 * Author           Date       Version               Remarks
 * mikewilliams  07.26.2023    1.00        Initial Creation of Script.
 * mikewilliams  08.18.2023    1.01        Modification of Saved Search and Logic.
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
      type: 'assemblybuild',
      filters: [
        ['type', 'anyof', 'Build'],
        'AND',
        ['trandate', 'within', 'today'],
        'AND',
        ['appliedtotransaction.createdfrom', 'noneof', '@NONE@'],
      ],
      columns: [
        search.createColumn({
          name: 'appliedtotransaction',
          label: 'Applied To Transaction',
        }),
        search.createColumn({
          name: 'built',
          join: 'appliedToTransaction',
          label: 'Built',
        }),
        search.createColumn({
          name: 'createdfrom',
          join: 'appliedToTransaction',
          label: 'Created From',
        }),
        search.createColumn({
          name: 'custbody_dm_line_number_mo',
          join: 'appliedToTransaction',
          label: 'Line Number',
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

      const searchResult = JSON.parse(mapContext.value);
      log.debug(strLoggerTitle + ' After Parsing Results', searchResult);
      //
      const key = searchResult.values['createdfrom.appliedToTransaction'].value;

      const values = {};
      values.lineId =
        searchResult.values[
          'custbody_dm_line_number_mo.appliedToTransaction'
        ].value;
      values.built = searchResult.values['built.appliedToTransaction'];
      values.millOrderId = searchResult.values['appliedtotransaction'].value;

      mapContext.write({
        key: key,
        value: values,
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
        log.debug(strLoggerTitle, result);
        //
        // Find sublist With Line ID
        const workOrderLineNumber = soRec.findSublistLineWithValue({
          sublistId: 'item',
          fieldId: 'woid',
          value: result.millOrderId,
        });
        log.debug(
          strLoggerTitle,
          'Work Order Line Number: ' + workOrderLineNumber
        );
        //
        // Update the Mill Order
        if (workOrderLineNumber !== -1) {
          soRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_mo_built_qty',
            line: workOrderLineNumber,
            value: result.built,
          });
          log.debug(strLoggerTitle, 'Mill Order Line Updated');
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
