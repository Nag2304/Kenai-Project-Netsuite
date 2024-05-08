/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */

define(["N/ui/dialog"], function (dialog) {
  function helloWorld() {
    var options = {
      title: "Hello!",
      message: "Hello, World!",
    };

    try {
      dialog.alert(options);

      log.debug({
        title: "Success",
        details: "Alert displayed successfully",
      });
    } catch (e) {
      log.error({
        title: e.name,
        details: e.message,
      });
    }
  }

  return {
    pageInit: helloWorld,
  };
});
