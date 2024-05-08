/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/runtime', 'N/log'], (runtime, log) => {
  const exports = {};
  /* ------------------------ Before Load Script Begin ------------------------ */
  function beforeLoad(scriptContext) {
    if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
      return;
    }
    const objForm = scriptContext.form;

    objForm.clientScriptModulePath = 'SuiteScripts/callForSuitelet_CS.js';
    objForm.addButton({
      id: 'custpage_suiteletbutton',
      label: 'Print Deposit',
      functionName: 'CallforSuiteletSO()',
    });
  }
  /* ------------------------ Before Load Script End ------------------------ */
  //
  /* ------------------------ Exports Begin ------------------------ */
  exports.beforeLoad = beforeLoad;
  return exports;
  /* ------------------------ Exportst End ------------------------ */
});
