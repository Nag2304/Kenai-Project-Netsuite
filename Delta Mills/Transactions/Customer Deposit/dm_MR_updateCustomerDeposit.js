/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
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
      type: 'customerdeposit',
      filters: [
        ['type', 'anyof', 'CustDep'],
        'AND',
        ['paymentmethod', 'anyof', '@NONE@'],
        'AND',
        ['otherrefnum', 'isnotempty', ''],
        'AND',
        ['mainline', 'is', 'T'],
      ],
      columns: [
        search.createColumn({ name: 'tranid', label: 'Document Number' }),
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
        search.createColumn({ name: 'paymentmethod', label: 'Payment Method' }),
        search.createColumn({ name: 'otherrefnum', label: 'PO/Check Number' }),
        search.createColumn({ name: 'paymentoption', label: 'Payment Option' }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Map Phase - Begin --------------------------- */
  const map = (mapContext) => {
    const strLoggerTitle = 'Summarize Phase';
    log.debug(strLoggerTitle, '-------------<< Map - Begin >>-------------');
    //
    try {
      // Read & parse the data
      const searchResult = JSON.parse(mapContext.value);
      log.debug(strLoggerTitle + ' After Parsing Results', searchResult);
      //
      const key = searchResult.id;
      record.submitFields({
        type: record.Type.CUSTOMER_DEPOSIT,
        id: key,
        values: {
          paymentoption: 2,
        },
        options: {
          enableSourcing: false,
          ignoreMandatoryFields: true,
        },
      });
      log.audit(strLoggerTitle, 'Customer Deposit Updated Successfully ' + key);
    } catch (error) {
      log.error(strLoggerTitle + ' failed to Execute', error);
    }
    //
    log.debug(strLoggerTitle, '-------------<< Map - Exit >>-------------');
  };
  /* ----------------------------- Map Phase - End ---------------------------- */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
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
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
