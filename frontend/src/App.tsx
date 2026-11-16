import { Link, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import RequireAuth from './components/RequireAuth'
import AuthForm from './pages/AuthForm'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import { OrderDetail, OrderList } from './pages/Orders'
import ProductPage from './pages/ProductPage'
import Store from './pages/Store'

const App = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/store" element={<Store />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<AuthForm mode="login" />} />
        <Route path="/register" element={<AuthForm mode="register" />} />
        {/* Signed-in only */}
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrderList />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderDetail />
            </RequireAuth>
          }
        />
        <Route
          path="*"
          element={
            <div className="container">
              <h1>Page not found</h1>
              <Link to="/">Go home</Link>
            </div>
          }
        />
      </Routes>
      <Footer />
    </>
  )
}

export default App
