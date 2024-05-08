function isEmpty(stValue) {
  return (
    stValue === '' ||
    stValue == null ||
    stValue == undefined ||
    (stValue.constructor === Array && stValue.length == 0) ||
    (stValue.constructor === Object &&
      (function (v) {
        for (var k in v) return false;
        return true;
      })(stValue))
  );
}
