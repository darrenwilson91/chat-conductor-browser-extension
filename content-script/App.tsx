import browser from "webextension-polyfill";
import {useEffect, useState} from "react";
import SignIn from "./SignIn";
import React from "react";

enum SCREEN {
  SIGN_IN, SIGN_UP, FACTS
}

const App = () => {
  const [fact, setFact] = useState('Click the button to check your prompt!');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState(SCREEN.FACTS);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState("")
  const [refreshToken, setRefreshToken] = useState("")

  async function getSession() {
    console.log("getSession run from App.tsx")
    const {data: {session}} = await browser.runtime.sendMessage({action: 'getSession'});
    setSession(session);
    console.log(session)
  }

  async function getAccessToken() {
    const {data, error} = await browser.runtime.sendMessage({action: 'getAccessToken'});
    console.log("fetched access token:")
    console.log(data)
    //console.log(accessToken)
    setAccessToken(data.restoredAccessToken)
    setRefreshToken(data.restoredRefreshToken)
  }

  useEffect(() => {
    getSession();
    getAccessToken();
  }, []);

  async function handleOnClick() {
    setLoading(true);
    const textArea = document.querySelector('textarea');
    const textValue = textArea ? textArea.value : '';
    if(textValue) { 
      const {data} = await browser.runtime.sendMessage({action: 'completion', value: {humanPrompt: textValue}});
      setFact(data);
      setLoading(false);
    }
  }

  async function handleSignUp(email: string, password: string) {
    await browser.runtime.sendMessage({action: 'signup', value: {email, password}});
    setScreen(SCREEN.SIGN_IN)
  }

  async function handleSignIn(email: string, password: string) {
    const {data, error} = await browser.runtime.sendMessage({action: 'signin', value: {email, password}});
    if (error) return setError(error.message)

    setSession(data.session)
  }

  async function handleSignOut() {
    const signOutResult = await browser.runtime.sendMessage({action: 'signout'});
    setScreen(SCREEN.SIGN_IN);
    setSession(signOutResult.data);
  }

  function renderApp() {
    console.log("rendering app-----")
    console.log(accessToken)
    if (!session && !accessToken) {
      if (screen === SCREEN.SIGN_UP) {
        return <SignIn onSignIn={handleSignUp} title={'Sign Up'} onScreenChange={() => {
          setScreen(SCREEN.SIGN_IN);
          setError('');
        }} helpText={'Got an account? Sign in'} error={error}/>;
      }
      return <SignIn title='Sign In' onSignIn={handleSignIn} onScreenChange={() => {
        setScreen(SCREEN.SIGN_UP)
        setError('');
      }} helpText={'Create an account'} error={error}/>
    }

    return (
      <>
        
        <p className='text-slate-800'>{fact}</p>
        <button
          className='px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm disabled:opacity-75 w-48'
          disabled={loading} onClick={handleOnClick}>Analyse prompt
        </button>
        <div>
          <a className='text-cyan-400' onClick={handleSignOut}>Sign out</a>
        </div>
      </>
    )
  }

  return (
    <div className='fixed bottom-0 right-0'>
      <div className='flex flex-col gap-4 p-4 shadow-sm bg-gradient-to-r from-purple-100 to-blue-200 w-96 rounded-md'>
        <h1>Chat Conductor</h1>
        {renderApp()}
      </div>
    </div>
  )
}
export default App;