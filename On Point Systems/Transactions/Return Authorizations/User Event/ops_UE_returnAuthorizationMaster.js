/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/**
 * Filename: ops_UE_returnAuthorizationMaster.js
 * Script: OPS | UE Return Authorization Master
 * Author           Date       Version               Remarks
 * mikewilliams  2022.12.28    1.00        Initial Creation of Script.
 * nagendrababu  2024.08.21    1.01        Add the logic related to Amazon Customer ID
 * nagendrabaub  2025.10.27    1.02        Added logic to the set the refund rate from invoices.
 */

/*global define,log*/
define([
  'SuiteScripts/Transactions/Return Authorizations/Modules/ops_Module_createIRorCM',
  'N/runtime',
  'SuiteScripts/Transactions/Return Authorizations/Modules/ops_Module_setRefundRate',
], (createIRorCM, runtime, setRefundRate) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------ Global Variables - End ------------------------ */

  /* --------------------------- After Submit - Begin -------------------------- */
  const afterSubmit = (scriptContext) => {
    const loggerTitle = 'After Submit';

    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' - Entry -------------------<|'
    );

    try {
      const executionContext = runtime.executionContext;
      log.debug(loggerTitle, `Execution Context: ${executionContext}`);

      // Ensure script runs only when triggered via UI
      if (executionContext === runtime.ContextType.USER_INTERFACE) {
        createIRorCM.afterSubmit(scriptContext);
      } else {
        log.audit(loggerTitle, 'Skipping execution as context is not UI.');
      }
      setRefundRate.afterSubmit(scriptContext);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }

    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' - Exit -------------------<|'
    );
  };
  /* ---------------------------- After Submit - End --------------------------- */

  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.afterSubmit = afterSubmit;
  return exports;
  /* ----------------------------- Exports - End ---------------------------- */
});
