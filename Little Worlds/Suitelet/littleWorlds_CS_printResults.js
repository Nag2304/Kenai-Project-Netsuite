/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
/*global define,log*/
define(['N/currentRecord', 'N/url'], function (currentRecord, url) {
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
  /* --------------------------- Apply Filters - Begin -------------------------- */
  function applyFilters() {
    var strLoggerTitle = ' Apply Filters ';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
      var record = currentRecord.get();

      var fields = {
        customerList: record.getValue({ fieldId: 'custpage_customer_list' }),
      };
      var locationStr = document.location.href;
      if (locationStr.indexOf('&filter=T') == -1) locationStr += '&filter=T';
      locationStr = locationStr.replace('&filter=F', '&filter=T');
      var parameterIds = Object.keys(fields);
      parameterIds.forEach(function (parameterId) {
        if (locationStr.indexOf('&' + parameterId) > -1) {
          locationStr = replaceParameter(
            locationStr,
            parameterId,
            fields[parameterId]
          );
        } else if (locationStr.indexOf('&' + parameterId) == -1) {
          locationStr += '&' + parameterId + '=' + fields[parameterId];
        }
      });
      //
      document.location = locationStr;

      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
  }
  /* ---------------------------- Apply Filters - End --------------------------- */
  //
  /* ---------------------------- Helper Functions - Begin --------------------------- */
  //
  /* ***********************  resetFormValues - Begin *********************** */
  function resetFormValues() {
    var strLoggerTitle = 'Reset Form Values';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
      var record = currentRecord.get();
      record.setValue({ fieldId: 'custpage_customer_list', value: '' });
      //
      var lineItemCount = record.getLineCount({
        sublistId: 'custpage_itemfulfillment_list',
      });
      log.debug(strLoggerTitle, 'Line Item Count: ' + lineItemCount);
      //
      if (lineItemCount > 0) {
        var suiteletURL = url.resolveScript({
          scriptId: 'customscript_lw_sl_printpackages',
          deploymentId: 'customdeploy_lw_sl_printpackages',
        });
        document.location = suiteletURL;
      }

      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
  }
  /* ***********************  resetFormValues - End *********************** */
  //
  /* ***********************  replaceParameter - Begin *********************** */
  /**
   *
   * @param {string} urlStr
   * @param {string} parameter
   * @param {string} value
   * @returns {string}
   */
  function replaceParameter(urlStr, parameter, value) {
    var strLoggerTitle = ' Replace Parameters ';
    var newStr = '';
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      var initParam = urlStr.indexOf('&' + parameter);
      var endParam = urlStr.indexOf('&' + parameter) + 1;
      while (
        endParam > -1 &&
        urlStr[endParam] != '&' &&
        endParam < urlStr.length
      )
        endParam++;
      var toReplace = urlStr.substring(initParam, endParam);
      newStr = urlStr.replace(toReplace, '&' + parameter + '=' + value);
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Exit--------------<|'
    );
    return newStr;
  }
  /* ***********************  replaceParameter - End *********************** */
  //
  /* ---------------------------- Helper Functions - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.pageInit = pageInit;
  exports.applyFilters = applyFilters;
  exports.resetFormValues = resetFormValues;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
