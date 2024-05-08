/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 *
 */

/* global define,log */

define(['N/record'], function (record) {
  /* ------------------------ Global variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global variables - End ------------------------- */
  //
  function printOrders(context) {
    alert(context);
  }
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.printOrders = printOrders;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
