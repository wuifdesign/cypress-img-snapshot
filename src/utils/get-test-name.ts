const getTestName = () => {
  const cypressContext: Mocha.Suite = (Cypress as any).mocha.getRunner().suite.ctx.test
  const testTitles: string[] = []
  const extractTitles = (obj: Mocha.Suite) => {
    if (obj.title) {
      testTitles.push(obj.title)
    }
    if (obj.parent) {
      extractTitles(obj.parent)
    }
  }
  extractTitles(cypressContext)
  return testTitles.reverse().join(' -- ')
}

export default getTestName
