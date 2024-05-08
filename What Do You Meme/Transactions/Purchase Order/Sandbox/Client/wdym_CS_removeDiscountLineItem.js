/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define([], function () {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------------- pageInit - Begin -------------------------- */
  function pageInit(scriptContext) {
    var strLoggerTitle = 'Page Init';
    log.debug(strLoggerTitle, '|>------------------Entry------------------<|');
    //
    if (scriptContext.mode === 'edit') {
      var newRecord = scriptContext.currentRecord;
      var discLineNumber = newRecord.findSublistLineWithValue({
        sublistId: 'item',
        fieldId: 'itemtype',
        value: 'Discount',
      });
      log.debug(strLoggerTitle, 'Discount Line Number ' + discLineNumber);

      if (discLineNumber !== -1) {
        newRecord.removeLine({
          sublistId: 'item',
          line: discLineNumber,
          ignoreRecalc: true,
        });
      }
    }
    //
    log.debug(strLoggerTitle, '|>------------------Exit------------------<|');
  }
  /* --------------------------- pageInit - End -------------------------- */
  //
  /* -------------------------- FieldChanged - Begin -------------------------- */
  function fieldChanged(scriptContext) {
    var strLoggerTitle = 'Page Init';
    log.debug(strLoggerTitle, '|>------------------Entry------------------<|');
    //
    try {
      var currentRecord = scriptContext.currentRecord;
      var fieldId = scriptContext.fieldId;

      if (fieldId === 'custbody_ex_factory_date') {
        var exFactoryDate = currentRecord.getValue({
          fieldId: 'custbody_ex_factory_date',
        });

        if (exFactoryDate) {
          var receiveByDate = new Date(exFactoryDate);
          receiveByDate.setDate(receiveByDate.getDate() + 6 * 7); // Adding 6 weeks

          currentRecord.setValue({
            fieldId: 'duedate',
            value: receiveByDate,
          });
        }
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(strLoggerTitle, '|>------------------Exit------------------<|');
  }
  /* --------------------------- FieldChanged - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.pageInit = pageInit;
  exports.fieldChanged = fieldChanged;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
