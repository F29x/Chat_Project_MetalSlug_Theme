
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Alert() {
  return (
    <div className='alert'>
      <ToastContainer 
        position="top-center" 
        autoClose={4000} 
        hideProgressBar 
        newestOnTop 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
      />
    </div>
  )
}

export default Alert;
