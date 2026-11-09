/** Execute pelo editor. Não registra nem retorna o segredo. */
function diagnosticarIntegracao() {
  const secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET') || '';
  const signature = secret ? Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, secret, Utilities.Charset.UTF_8)
    .map(function(byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('').slice(0, 12) : '';
  const report = {
    chaveConfigurada: !!secret,
    tamanhoChave: secret.length,
    assinaturaChave: signature,
    urlDoProjeto: ScriptApp.getService().getUrl(),
  };
  try {
    const book = book_();
    report.planilhaCorreta = book.getId() === '1GqFTftQ0MBzt9N4SsRbUq5X4aZoCGmz90QeHFekKOuc';
    report.abasAusentes = Object.keys(HEADERS).filter(function(name) { return !book.getSheetByName(name); });
    const data = publicData_();
    report.leituraFuncionou = true;
    report.quantidadeHoteis = data.hotels.length;
  } catch (error) {
    report.leituraFuncionou = false;
    report.erroLeitura = error.message;
  }
  console.log(JSON.stringify(report, null, 2));
}
