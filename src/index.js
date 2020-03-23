import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import produce from 'immer'
import { createStore } from 'redux'
import { Provider, useSelector } from 'react-redux'

const follow = (obj, path) => {
  if (!path.forEach) debugger
  for (let i = 0; i < path.length; i++) {
    const p = path[i]
    if (!(p in obj)) return {}
    obj = obj[p]
  }
  return obj
}

const set = (obj, path, value) => {
  for (let i = 0; i < path.length - 1; i++) {
    const elem = path[i]
    if (!(elem in obj)) {
      obj[elem] = {}
    }
    obj = obj[elem]
  }
  obj[path[path.length - 1]] = value
}


const reducer = (state, action) => {
  // The following code needs to be added to the reducer
  if (action.type === "__set") {
    if (action.path.length === 0) return action.value
    return produce(state, st => {
      set(st, action.path, action.value)
    })
  }
  return state
}

const store = createStore(
  reducer,
  {},
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

const init = (root, initialValue) => {
  store.dispatch({ type: "__set", path: root, value: initialValue })
}

const storeState = root => {
  follow(store.getState(), root)
}


function UseInit(root, initialValue) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    init(root, initialValue)
    setLoaded(true)
  }, [])
  return loaded
}


function UseGlobal(root, initialValue) {
  const loaded = UseInit(root, initialValue)
  return useSelector(st => {
    //if (loaded) debugger
    return loaded ? follow(st, root) : initialValue
  })
}

const setGlobal = (path, f) => {
  const oldVal = follow(store.getState(), path)
  const newVal = produce(oldVal, f)
  store.dispatch({ type: "__set", path, value: newVal })
}

// The following is an example of a stateless component that plugs into redux
// In practice, I would make the component much more generic
// I made it specific to make it more concrete
function EmailForm({ root, onSubmit }) {
  const state = UseGlobal(root, { email: "" })
  return (<form onSubmit={() => onSubmit(storeState(["signup"]))}>
    <div>Email <input
      value={state.email}
      onChange={ev => {
        setGlobal(root, st => {
          st.email = ev.target.value
        })
        //store.dispatch({ type: "__set", prop: "email", path: root, value: ev.target.value })
      }} /></div>
  </form>)
}

function HidableForm({ root, onSubmit }) {
  const state = UseGlobal(root, { shown: false })
  return (
    <>
      <div><button onClick={() => {
        setGlobal(root, st => {
          st.shown = !st.shown
        })
      }}>Hide</button></div>
      {state.shown && <EmailForm
        root={root.concat("EmailForm")}
        onSubmit={onSubmit} />}
    </>
  )
}



function App() {
  return <>
    <div>
      <h3>Join the newsletter</h3>
      <EmailForm
        root={["newsletter"]}
        onSubmit={data => {
          alert(JSON.stringify(data))
        }}
      />
    </div>
    <div>
      <h3>Reset your password</h3>
      <EmailForm
        root={["forgotPassword"]}
        onSubmit={data => {
          alert(JSON.stringify(data))
        }}
      />
    </div>
    <HidableForm
      root={["HidableForm"]}
      onSubmit={data => {
        alert(JSON.stringify(data))
      }} />
  </>
}

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
