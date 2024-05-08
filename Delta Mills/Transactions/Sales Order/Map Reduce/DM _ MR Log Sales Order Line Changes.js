/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * Fileanme: dm_MR_logSalesOrderChanges.js
 * Script: DM | MR Log Sales Order Line Changes
 * Author           Date       Version               Remarks
 * mikewilliams  2022.10.05    1.00        Initial Creation of Script.
 * mikewilliams  2022.12.02    1.01        Added array line level fields to write only for specific fields.
 */

/* global define,log*/

define(['N/search', 'N/record', 'N/format'], (search, record, format) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const lineLevelFields = [
    'Item',
    'Sell Qty',
    'Sell UOM',
    'Product Name',
    'Nominal Thickness',
    'Nominal Width',
    'Mill Profile',
    'Finished Dimensions',
    'Finished Dimensions - Thickness',
    'Finished Dimensions - Exposed Face Width',
    'Finish',
    'Sales Order Notes',
    'Sell Rate',
    'Application',
    'Lengths',
    'Relief Cuts',
    'Production Notes',
    'Procurement Notes',
  ];
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    // SalesOrd:E       Sales Order:Pending Billing/Partially Fulfilled
    // SalesOrd:B      	Sales Order:Pending Fulfillment
    //SalesOrd:D     	  Sales Order:Partially Fulfilled
    return search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['linesystemnotes.date', 'onorafter', 'hoursago1'],
        'AND',
        ['status', 'anyof', 'SalesOrd:E', 'SalesOrd:B', 'SalesOrd:D'],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'SO Internal ID' }),
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
        search.createColumn({ name: 'custbody3', label: 'Project Name' }),
        search.createColumn({ name: 'trandate', label: 'Date' }),
        search.createColumn({ name: 'item', label: 'Item' }),
        search.createColumn({
          name: 'internalid',
          join: 'item',
          label: 'Internal ID',
        }),
        search.createColumn({
          name: 'date',
          join: 'lineSystemNotes',
          label: 'Date',
        }),
        search.createColumn({
          name: 'field',
          join: 'lineSystemNotes',
          label: 'Field',
        }),
        search.createColumn({
          name: 'newvalue',
          join: 'lineSystemNotes',
          label: 'New Value',
        }),
        search.createColumn({
          name: 'oldvalue',
          join: 'lineSystemNotes',
          label: 'Old Value',
        }),
        search.createColumn({
          name: 'name',
          join: 'lineSystemNotes',
          label: 'Set by',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------- Map - Begin ------------------------- */
  //   const map = (mapContext) => {
  //     const strLoggerTitle = 'Map Phase';
  //     log.debug(strLoggerTitle, '-------------<< Map - Entry >>-------------');
  //     try {
  //       // Read & parse the data
  //       const searchResult = JSON.parse(mapContext.value);
  //       log.debug(strLoggerTitle + ' After Parsing Results', searchResult);

  //     } catch (error) {
  //       log.error(strLoggerTitle + ' Failed to Execute', error);
  //     }
  //     log.debug(strLoggerTitle, '-------------<< Map - Exit >>-------------');
  //   };
  /* ------------------------- Map - End ------------------------- */
  //
  /* ------------------------- Reduce - Begin ------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    log.debug(strLoggerTitle, '-------------<< Reduce - Entry >>-------------');
    const recordDetails = {};
    let previousLineItemInternalId;
    try {
      // Read Key
      const soInternalId = reduceContext.key;
      log.debug(strLoggerTitle + ' Reduce SO Key', soInternalId);
      const soRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: soInternalId,
        isDynamic: false,
      });
      //
      // Read Body & Line Values
      const values = reduceContext.values;
      const lengthOfArr = values.length;

      // Body Value
      const bodyValue = JSON.parse(values[0]);
      recordDetails.projectName = bodyValue.values.custbody3;
      recordDetails.documentNumber = bodyValue.values.tranid;
      let soDate = bodyValue.values.trandate;
      recordDetails.soDate = '';
      if (soDate) {
        recordDetails.soDate = format.parse({
          value: soDate,
          type: format.Type.DATE,
        });
      }

      /* ------------------------- Loop Thru Values Begin ------------------------- */
      for (let index = 0; index < lengthOfArr; index++) {
        const result = JSON.parse(values[index]);
        log.debug(strLoggerTitle + ' After Parsing Each Result', result);
        // Item Number
        const lineItemInternalId = result.values.item.value;
        log.debug(strLoggerTitle, `Line Item InternalId:${lineItemInternalId}`);
        //
        // Retrieve Line Number and Work Order Document Number
        if (previousLineItemInternalId !== lineItemInternalId) {
          // Read Line Number
          const lineNumber = soRecord.findSublistLineWithValue({
            sublistId: 'item',
            fieldId: 'item',
            value: lineItemInternalId,
          });
          recordDetails.soLineNumber = lineNumber + 1;
          log.debug(
            strLoggerTitle,
            `SO Line Number:${recordDetails.soLineNumber}`
          );

          previousLineItemInternalId = lineItemInternalId;
          // Get Work Order Document Number
          const woInternalId = soRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'woid',
            line: lineNumber,
          });
          recordDetails.millOrderNo = '';
          if (woInternalId) {
            const woDocumentNumber = search.lookupFields({
              type: search.Type.WORK_ORDER,
              id: woInternalId,
              columns: ['tranid'],
            }).tranid;
            recordDetails.millOrderNo = woDocumentNumber;
          }
          log.debug(
            strLoggerTitle,
            `Mill Order Number:${recordDetails.millOrderNo}`
          );
          //
        }
        log.debug(
          strLoggerTitle,
          `Prvs Item Internal ID:${previousLineItemInternalId} current Line Item Internal ID:${lineItemInternalId}`
        );
        //
        // Line Level Fields
        let currentDate = result.values['date.lineSystemNotes'];
        //currentDate = currentDate.split(' ')[0];
        recordDetails.currentDate = '';
        if (currentDate) {
          recordDetails.currentDate = format.parse({
            value: currentDate,
            type: format.Type.DATE,
          });
        }
        log.debug(strLoggerTitle, `Current Date:${recordDetails.currentDate}`);

        recordDetails.fieldChanged =
          result.values['field.lineSystemNotes'].text;
        log.debug(
          strLoggerTitle,
          `Field Changed:${recordDetails.fieldChanged}`
        );

        recordDetails.oldValue = result.values['oldvalue.lineSystemNotes'];
        log.debug(strLoggerTitle, `Old Value:${recordDetails.oldValue}`);

        recordDetails.newValue = result.values['newvalue.lineSystemNotes'];
        log.debug(strLoggerTitle, `New Value:${recordDetails.newValue}`);

        recordDetails.user = result.values['name.lineSystemNotes'].text;
        log.debug(strLoggerTitle, `set by:${recordDetails.user}`);

        insertCustomRecord(recordDetails);
      }
      /* ------------------------- Loop Thru Values End ------------------------- */
      //
      log.audit(
        strLoggerTitle,
        `SO Internal ID:${reduceContext.key} processed successfully`
      );
    } catch (error) {
      log.error(strLoggerTitle + ' Failed to Execute', error);
    }
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
  /* *********************** insertCustomRecord - Begin *********************** */
  /**
   *
   * @param {object} options - contains all the field details
   */
  const insertCustomRecord = (options) => {
    const strLoggerTitle = 'Customer Order Log Report';
    log.debug(
      strLoggerTitle,
      '-------------<< Custom Record Insert - Entry >>-------------'
    );
    try {
      log.debug(strLoggerTitle, options);
      if (lineLevelFields.indexOf(options.fieldChanged) > -1) {
        // Custom Record
        const customRec = record.create({
          type: 'customrecord_dm_custorder_logreport',
          isDynamic: true,
        });
        // soLineNumber
        customRec.setValue({
          fieldId: 'custrecord_dm_line_no',
          value: options.soLineNumber,
        });
        // projectName
        customRec.setValue({
          fieldId: 'custrecord_dm_project',
          value: options.projectName,
        });
        // tranDate
        log.debug(strLoggerTitle, `tran Date:${options.soDate}`);
        customRec.setValue({
          fieldId: 'custrecord_dm_date',
          value: options.soDate,
        });
        // documentnumber
        log.debug(strLoggerTitle, `Document Number:${options.documentNumber}`);
        customRec.setValue({
          fieldId: 'custrecord_dm_custorder_number',
          value: options.documentNumber,
        });
        // currentDate
        log.debug(strLoggerTitle, `tran Date:${options.currentDate}`);
        customRec.setValue({
          fieldId: 'custrecord_dm_sys_datechange',
          value: options.currentDate,
        });
        // Mill Order #
        customRec.setValue({
          fieldId: 'custrecord_dm_millorder_number',
          value: options.millOrderNo,
        });
        // Line Level Fields
        customRec.setValue({
          fieldId: 'custrecord_dm_fieldchanged',
          value: options.fieldChanged,
        });
        customRec.setValue({
          fieldId: 'custrecord_dm_oldvalue',
          value: options.oldValue,
        });
        customRec.setValue({
          fieldId: 'custrecord_dm_newvalue',
          value: options.newValue,
        });
        customRec.setValue({
          fieldId: 'custrecord_dm_setby',
          value: options.user,
        });
        //
        // Save the custom record
        const customRecId = customRec.save();
        log.audit(
          strLoggerTitle,
          'Custom Record Saved Successfully ' + customRecId
        );
      }
    } catch (error) {
      log.error(strLoggerTitle + ' failed to Execute', error);
    }
    log.debug(
      strLoggerTitle,
      '-------------<< Custom Record Insert - Exit >>-------------'
    );
  };
  /* *********************** insertCustomRecord - End *********************** */
  //
  /* ----------------------- Internal Functions - End ----------------------- */
  //
  /* ------------------------- Exports - Begin ------------------------- */
  exports.getInputData = getInputData;
  //exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------- Exports - End ------------------------- */
});
