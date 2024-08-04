/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

/*global define,log*/

define(['N/ui/serverWidget'], (ui) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- onRequest - Begin --------------------------- */
  const onRequest = (context) => {
    const loggerTitle = 'On Request';
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      //
      /* ---------------------------- GET METHOD - Begin ---------------------------- */
      if (context.request.method === 'GET') {
      }
      /* ---------------------------- GET METHOD - End ---------------------------- */
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Exit--------------<|'
    );
  };
  /* ---------------------------- onRequest - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
