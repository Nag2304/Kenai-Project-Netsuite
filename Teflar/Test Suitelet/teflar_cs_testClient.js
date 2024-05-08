/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url'], function (url) {
  function fieldChanged(context) {
    // Navigate to selected page
    if (context.fieldId == 'custpage_pageid') {
      var pageId = context.currentRecord.getValue({
        fieldId: 'custpage_pageid',
      });

      pageId = parseInt(pageId.split('_')[1]);

      document.location = url.resolveScript({
        scriptId: getParameterFromURL('script'),
        deploymentId: getParameterFromURL('deploy'),
        params: {
          page: pageId,
        },
      });
    }
  }

  function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, pageId) {
    document.location = url.resolveScript({
      scriptId: 'customscript_teflar_test_suitelet',
      deploymentId: 'customdeploy_teflar_test_suitelet',
      params: {
        page: pageId,
      },
    });
  }

  function getParameterFromURL(param) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (pair[0] == param) {
        return decodeURIComponent(pair[1]);
      }
    }
    return false;
  }

  return {
    fieldChanged: fieldChanged,
    getSuiteletPage: getSuiteletPage,
  };
});
