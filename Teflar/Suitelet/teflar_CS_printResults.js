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
        itemtype: record.getText({ fieldId: 'custpage_item_type' }),
        itemname: record.getValue({ fieldId: 'custpage_item_number' }),
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
      resetFormValues();
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
  /* --------------------------- printGTIN12 - Begin -------------------------- */
  function printGTIN12() {
    var strLoggerTitle = 'printGTIN12';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
      var record = currentRecord.get();
      var sublistLength = record.getLineCount('custpage_item_list');
      var records = [];
      // Loop Through the records
      for (var i = 0; i < sublistLength; i++) {
        var isSelected = record.getSublistValue(
          'custpage_item_list',
          'custpage_print',
          i
        );
        if (isSelected) {
          records.push(
            record.getSublistValue(
              'custpage_item_list',
              'custpage_item_internalid',
              i
            )
          );
        }
        log.audit(strLoggerTitle + ' Total Records', records);
      }
      //

      if (records.length > 0) {
        var suiteletURL = url.resolveScript({
          scriptId: 'customscript_teflar_sl_printitempdf',
          deploymentId: 'customdeploy_teflar_sl_printitempdf',
          params: {
            records: records.toString(),
            printLayout: 12,
          },
        });
        document.location = suiteletURL;
      } else {
        alert('Please select orders to print');
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
  }
  /* ---------------------------- printGTIN12 - End --------------------------- */
  //
  /* --------------------------- printGTIN14 - Begin -------------------------- */
  function printGTIN14() {
    var strLoggerTitle = 'printGTIN14';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
      var record = currentRecord.get();
      var sublistLength = record.getLineCount('custpage_item_list');
      var records = [];
      for (var i = 0; i < sublistLength; i++) {
        var isSelected = record.getSublistValue(
          'custpage_item_list',
          'custpage_print',
          i
        );
        if (isSelected) {
          records.push(
            record.getSublistValue(
              'custpage_item_list',
              'custpage_item_internalid',
              i
            )
          );
        }
        log.audit(strLoggerTitle + ' Total Records', records);
      }

      if (records.length > 0) {
        var suiteletURL = url.resolveScript({
          scriptId: 'customscript_teflar_sl_printitempdf',
          deploymentId: 'customdeploy_teflar_sl_printitempdf',
          params: {
            records: records.toString(),
            printLayout: 14,
          },
        });
        document.location = suiteletURL;
      } else {
        alert('Please select orders to print');
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
  }
  /* --------------------------- printGTIN14 - End -------------------------- */
  //
  /* ----------------------- Internal Functions - Begin ----------------------- */
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
      record.setValue({ fieldId: 'custpage_item_type', value: '' });
      record.setValue({ fieldId: 'custpage_item_number', value: '' });
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
  /* ------------------------ Internal Functions - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.pageInit = pageInit;
  exports.applyFilters = applyFilters;
  exports.printGTIN12 = printGTIN12;
  exports.printGTIN14 = printGTIN14;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
