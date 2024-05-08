/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
/*global define,log*/
define(['N/currentRecord', 'N/search'], function (currentRecord, search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  var exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- pageInit - Begin ---------------------------- */
  function pageInit() {
    var strLoggerTitle = 'Page Init';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
  }
  /* ----------------------------- pageInit - End ---------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.pageInit = pageInit;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
