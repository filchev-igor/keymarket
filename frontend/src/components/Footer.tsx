import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <>
      <div className="pay-strip">
        Payments in this demo are simulated. No real money is involved.
      </div>
      <footer className="footer">
        <div className="container">
          <div className="footer-cols">
            <div>
              <h4>keymarket</h4>
              <ul>
                <li>A demo game-key marketplace built as an internship assignment.</li>
              </ul>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                <li>
                  <Link to="/store">All games</Link>
                </li>
                <li>
                  <Link to="/store?sort=popularity">Best sellers</Link>
                </li>
                <li>
                  <Link to="/store?sort=discount">Hot deals</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li>
                  <Link to="/login">Sign in</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
                <li>
                  <Link to="/orders">My orders</Link>
                </li>
                <li>
                  <Link to="/cart">Cart</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-legal">
            Demo project. Games, sellers and keys are fictional, and any resemblance to real
            products is coincidental. Not affiliated with any game platform or store. Payments are
            simulated. Please do not enter real personal data.
            <br />© 2026 keymarket demo.
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer
