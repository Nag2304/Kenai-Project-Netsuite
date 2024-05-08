/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*global define,log*/

define(['N/search'], (search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- Before Load - Begin -------------------------- */
  const beforeLoad = (scriptContext) => {
    const strLoggerTitle = 'Before Load';
    log.audit(
      strLoggerTitle,
      '|>------------------- Starting -' +
        strLoggerTitle +
        '-------------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------- Exiting -' +
        strLoggerTitle +
        '-------------------<|'
    );
  };
  /* ---------------------------- Before Load - End --------------------------- */
  //
  /* --------------------------- Before Submit- Begin -------------------------- */
  const beforeSubmit = (scriptContext) => {
    const strLoggerTitle = 'Before Submit';
    log.audit(
      strLoggerTitle,
      '|>------------------- Starting -' +
        strLoggerTitle +
        '-------------------<|'
    );
    //
    if (scriptContext.type !== scriptContext.UserEventType.CREATE) {
      const leadRecord = scriptContext.newRecord;
      let unqualifiedStatusFlag = false;
      try {
        const leadSearchObj = search.create({
          type: 'lead',
          filters: [
            ['stage', 'anyof', 'LEAD'],
            'AND',
            ['isinactive', 'is', 'F'],
            'AND',
            ['messages.isincoming', 'is', 'T'],
            'AND',
            ['internalidnumber', 'equalto', leadRecord.id],
          ],
          columns: [
            search.createColumn({
              name: 'authoremail',
              join: 'messages',
              label: 'Message Auth Email',
            }),
            search.createColumn({
              name: 'isincoming',
              join: 'messages',
              label: 'Message Incoming',
            }),
            search.createColumn({
              name: 'messagedate',
              join: 'messages',
              label: 'Message Date',
            }),
            search.createColumn({
              name: 'lastmodifieddate',
              label: 'Date Last Modified',
            }),
          ],
        });
        const searchResultCount = leadSearchObj.runPaged().count;
        log.debug(strLoggerTitle, ' Search Result Count: ' + searchResultCount);

        if (searchResultCount) {
          leadSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            const messagesDate = result.getValue({
              name: 'messagedate',
              join: 'messages',
              label: 'Message Date',
            });
            const lastModifiedDate = result.getValue({
              name: 'lastmodifieddate',
              label: 'Date Last Modified',
            });
            log.debug(strLoggerTitle, {
              messagesDate: messagesDate,
              dateLastModified: lastModifiedDate,
            });
            if (messagesDate >= lastModifiedDate) {
              unqualifiedStatusFlag = true;
              return false;
            }
            return true;
          });

          const leadStatus = leadRecord.getValue({ fieldId: 'entitystatus' });
          log.debug(
            strLoggerTitle,
            ' Lead Status: ' +
              leadStatus +
              ' UnQualified Status Flag: ' +
              unqualifiedStatusFlag
          );
          if (leadStatus == '21' && unqualifiedStatusFlag) {
            // Lead Status - Unqualified
            leadRecord.setValue({ fieldId: 'entitystatus', value: 6 });
          }
        }
      } catch (error) {
        log.error(strLoggerTitle + ' caught with an exception', error);
      }
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------- Exiting -' +
        strLoggerTitle +
        '-------------------<|'
    );
  };
  /* ---------------------------- Before Submit - End --------------------------- */
  //
  /* --------------------------- After Submit- Begin -------------------------- */
  const afterSubmit = (scriptContext) => {
    const strLoggerTitle = 'After Submit';
    log.audit(
      strLoggerTitle,
      '|>------------------- Starting -' +
        strLoggerTitle +
        '-------------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------- Exiting -' +
        strLoggerTitle +
        '-------------------<|'
    );
  };
  /* ---------------------------- After Submit - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.beforeLoad = beforeLoad;
  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
