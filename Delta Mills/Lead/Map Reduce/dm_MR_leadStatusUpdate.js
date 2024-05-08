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
    const leadSearchColStatus = search.createColumn({ name: 'entitystatus' });
    const leadSearchColLastModified = search.createColumn({
      name: 'lastmodifieddate',
    });
    const leadSearchColDate = search.createColumn({
      name: 'messagedate',
      join: 'messages',
    });
    const leadSearch = search.create({
      type: 'lead',
      filters: [
        ['stage', 'anyof', 'LEAD'],
        'AND',
        ['isinactive', 'is', 'F'],
        'AND',
        ['messages.isincoming', 'is', 'T'],
        'AND',
        ['status', 'anyof', '21'],
      ],
      columns: [
        leadSearchColStatus,
        leadSearchColLastModified,
        leadSearchColDate,
      ],
    });
    return leadSearch;
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ------------------------- Reduce - Begin ------------------------- */
  const reduce = (reduceContext) => {
    const strLoggerTitle = 'Reduce Phase';
    log.audit(
      strLoggerTitle,
      '|>------------------------' +
        strLoggerTitle +
        '- Entry------------------------<|'
    );
    const key = reduceContext.key;
    let messageBlock = false;
    //
    try {
      log.debug(strLoggerTitle, ' Reduce Context: ' + key);
      //

      const values = reduceContext.values;
      for (let index = 0; index < values.length; index++) {
        const result = JSON.parse(values[index]);
        log.debug(strLoggerTitle + ' Reduce Context Values', result);
        //
        const value = result.values;
        log.debug(strLoggerTitle + ' Reduce Context Each Value', value);
        //
        const lastModifiedDate = value.lastmodifieddate;
        const messagesDate = value['messagedate.messages'];
        if (messagesDate >= lastModifiedDate) {
          messageBlock = true;
          break;
        }
      }
      //
      if (messageBlock) {
        // Update Lead Record
        record.submitFields({
          type: record.Type.LEAD,
          id: key,
          values: {
            entitystatus: 6,
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });
        //
        log.audit(strLoggerTitle, ' Lead Record Updated Successfully ' + key);
      }
    } catch (error) {
      log.error(
        strLoggerTitle + ' caught with an exception and internal id is: ' + key,
        error
      );
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------------' +
        strLoggerTitle +
        '- Exit------------------------<|'
    );
  };
  /* ------------------------- Reduce - End ------------------------- */
  //
  /* ------------------------- Summarize - Begin ------------------------- */
  const summarize = (summarizeContext) => {
    const strLoggerTitle = 'Summarize Phase';
    log.audit(
      strLoggerTitle,
      '|>------------------------' +
        strLoggerTitle +
        '- Entry------------------------<|'
    );
    //
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
    //
    log.audit(
      strLoggerTitle,
      '|>------------------------' +
        strLoggerTitle +
        '- Exit------------------------<|'
    );
  };
  /* ------------------------- Summarize - End ------------------------- */
  //
  /* ------------------------- Exports - Begin ------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------- Exports - End ------------------------- */
});
