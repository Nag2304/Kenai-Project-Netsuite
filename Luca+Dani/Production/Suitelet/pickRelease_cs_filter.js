/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/currentRecord', 'N/url', 'N/https'], function (
  currentRecord,
  urlModule,
  https
) {
  const exports = {};
  /* --------------------------- Page Init Begin -------------------------- */
  function pageInit(context) {
    try {
      //Get the current record on the page load.
      window.onbeforeunload = null;
      document.getElementById('submitter').type = 'button';
      document.getElementById('submitter').onclick = function () {
        printOrders();
      };
      document.getElementById('secondarysubmitter').type = 'button';
      document.getElementById('secondarysubmitter').onclick = function () {
        printOrders();
      };
    } catch (err) {
      console.log(err);
    }
  }
  function printOrders() {
    var record = currentRecord.get();
    var sublistLength = record.getLineCount('custpage_sublist');
    var records = [];
    for (var i = 0; i < sublistLength; i++) {
      var isSelected = record.getSublistValue(
        'custpage_sublist',
        'custpage_sublist_print',
        i
      );
      if (isSelected) {
        records.push(
          record.getSublistValue('custpage_sublist', 'custpage_sublist_soid', i)
        );
      }
    }

    var formType = record.getValue('custpage_formtype');
    if (records.length > 0) {
      var link = urlModule.resolveScript({
        scriptId: 'customscript_print_orders_ticket',
        deploymentId: 'customdeploy1',
        returnExternalUrl: true,
        params: {
          summary: 'T',
          formType: formType,
          records: records.toString(),
        },
      });

      var win = window.open(link, '_blank');
      link = urlModule.resolveScript({
        scriptId: 'customscript_print_orders_ticket',
        deploymentId: 'customdeploy1',
        returnExternalUrl: true,
        params: {
          summary: 'F',
          formType: formType,
          records: records.toString(),
        },
      });

      win = window.open(link, '_blank');
      https.get
        .promise(
          urlModule.resolveScript({
            scriptId: 'customscript_print_orders_ticket',
            deploymentId: 'customdeploy1',
            returnExternalUrl: true,
            params: {
              summary: 'F',
              formType: formType,
              records: records.toString(),
              markorders: 'T',
            },
          })
        )
        .then(function (response) {
          log.debug({
            title: 'Response',
            details: response,
          });
        })
        .catch(function onRejected(reason) {
          log.debug({
            title: 'Invalid Get Request: ',
            details: reason,
          });
        });
      document.location =
        urlModule.resolveScript({
          scriptId: 'customscript_pickrelease_v2',
          deploymentId: 'customdeploy1',
          returnExternalUrl: false,
          params: {
            filter: 'F',
            location: record.getValue('custpage_location'),
            form: record.getValue('custpage_formtype'),
          },
        }) +
        '&item=&reprinting=false&holdship=false&giftNote=false&stack=false&personalized=true&batch=false&ship=&channel=' +
        record.getValue('custpage_channel') +
        '&singleline=false';

      win.focus();
    } else {
      alert('Please select orders to print');
    }
  }

  function getDateFormat(dateValue) {
    if (dateValue == null) {
      return '';
    }
    return (
      dateValue.getMonth() +
      1 +
      '/' +
      dateValue.getDate() +
      '/' +
      dateValue.getFullYear()
    );
  }

  function applyFilters() {
    var record = currentRecord.get();

    var fromDate = getDateFormat(record.getValue('custpage_from_date'));
    var toDate = getDateFormat(record.getValue('custpage_to_date'));

    fields = {
      location: record.getValue('custpage_location'),
      form: record.getValue('custpage_formtype'),
      item: record.getValue('custpage_item'),
      binref: record.getValue('custpage_binref'),

      fromDate: fromDate,
      toDate: toDate,

      custpage_batch_size: record.getValue('custpage_batch_size'),
      custpage_print_options: record.getValue('custpage_print_options'),
      custpage_source_name: record.getValue('custpage_source_name'),

      reprinting: record.getValue('custpage_reprint'),
      holdship: record.getValue('custpage_holdship'),
      giftNote: record.getValue('custpage_includesgiftnote'),
      stack: record.getValue('custpage_includesstack'),
      personalized: record.getValue('custpage_personalizeditem'),
      batch: record.getValue('custpage_processbatchpick'),
      ship: record.getValue('custpage_shipvia'),
      channel: record.getValue('custpage_channel'),
      singleline: record.getValue('custpage_single_line'),
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
    document.location = locationStr;
  }
  function replaceParameter(urlStr, parameter, value) {
    var initParam = urlStr.indexOf('&' + parameter);
    var endParam = urlStr.indexOf('&' + parameter) + 1;
    while (endParam > -1 && urlStr[endParam] != '&' && endParam < urlStr.length)
      endParam++;
    var toReplace = urlStr.substring(initParam, endParam);
    var newStr = urlStr.replace(toReplace, '&' + parameter + '=' + value);

    return newStr;
  }
  /* ---------------------------- Field Changed End --------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.pageInit = pageInit;
  exports.applyFilters = applyFilters;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
