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
    objForm.clientScriptModulePath = 'SuiteScripts/callForSuitelet_WO.js';
    objForm.addButton({
      id: 'custpage_suiteletbutton',
      label: "Print DOP's",
      functionName: 'CallforSuiteletWO',
    });
    objForm.addButton({
      id: 'custpage_suiteletbutton_misc',
      label: 'Print Misc',
      functionName: 'miscButton',
    });
  }
  /* ------------------------ Before Load Script End ------------------------ */
  //
  /* ------------------------ Exports Begin ------------------------ */
  exports.beforeLoad = beforeLoad;
  return exports;
  /* ------------------------ Exportst End ------------------------ */
});
