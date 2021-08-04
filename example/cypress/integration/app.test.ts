/// <reference types="cypress" />
/// <reference types="cypress-img-snapshot" />

describe('App', () => {
  it('should render', () => {
    cy.visit('http://localhost:3000')
    cy.matchImageSnapshot()
  })
  it('should render logo', () => {
    cy.visit('http://localhost:3000')
    cy.get('.App-logo').matchImageSnapshot({ blackout: [] })
  })
})

export {}
