import browser from "webextension-polyfill";
//import supabase from './src/supabase_client';
import { createClient } from '@supabase/supabase-js'

type Message = {
  action: 'fetch' | 'getSession' | 'signout' | 'getAccessToken',
  value: null
} | {
  action: 'signup' | 'signin',
  value: {
    email: string,
    password: string,
  }
} | {
  action: 'completion',
  value: {
    humanPrompt: string,
  }
}

const supabaseUrl = 'https://yxkbvrpqjhutlzngywji.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a2J2cnBxamh1dGx6bmd5d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODUzNDg5NDQsImV4cCI6MjAwMDkyNDk0NH0.I6_D8Pt8wzS19vx9QjObmhGijH49L2n9BKnbqtuSkN4';
let access_token = ""
// Restore the user's session from Chrome storage
chrome.storage.local.get('access_token', function(data) {
  access_token = data.session
})

const supabase = createClient(supabaseUrl, supabaseKey)

let currentSession: any = null;
let currentUser: any = null;

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event);
  if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
    const { data: { user } } = await supabase.auth.getUser();
    console.log("user data:");
    console.log(user);

    // Update the global session and user data
    currentSession = session;
    currentUser = user;


    chrome.storage.local.set({access_token: session?.access_token}, function() {
      console.log('Access token is stored');
    });

    chrome.storage.local.set({refresh_token: session?.refresh_token}, function() {
      console.log('Refresh token is stored');
    });

  } else {
    console.log("User not logged in");

    // Reset the global session and user data
    currentSession = null;
    currentUser = null;

  }
});


type ResponseCallback = (data: any) => void

const isJwtExpired = (jwt) => {
  const payload = jwt.split('.')[1];
  const decodedPayload = JSON.parse(atob(payload));
  const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();

  return currentTime > expirationTime;
};


async function handleMessage({action, value}: Message, response: ResponseCallback) {
  if (action === 'completion') {
    console.log("completion action is running in background")
    await chrome.storage.local.get('access_token', function(data) {
      console.log("fetching chrome storage")
      if (data.access_token) {
        console.log("access token is good")
        
        const accessToken = data.access_token
        console.log(accessToken)

        const apiURL = 'https://yxkbvrpqjhutlzngywji.functions.supabase.co/completion';
        const requestOptions = {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
          },
          body: JSON.stringify(value)
        };

        fetch(apiURL, requestOptions)
          .then(response => response.json())
          .then(data => {
            const analyzedText = data.content // Use the content property inside the response object
            response({ data: analyzedText, error: null})
          })
          .catch(error => {
            console.error('Error:', error);
            response({ data: "an error occurred", error: error })
          });
      }
    });

  } else if (action === 'fetch') {
    const result = await fetch('https://meowfacts.herokuapp.com/');

    const { data } = await result.json();

    response({ message: 'Successfully signed up!', data });
  } else if (action === 'signup') {
    const result = await supabase.auth.signUp(value)
    response({message: 'Successfully signed up!', data: result});
  } else if (action === 'signin') {
    console.log('requesting auth');
    const {data, error} = await supabase.auth.signInWithPassword(value);
    console.log('auth data')
    console.log(data)

    const { data: { user } } = await supabase.auth.getUser()

    console.log("user data at login:")
    console.log(user)
    response({data, error});
  }  else if (action === 'getSession') {
    supabase.auth.getSession().then(response)
  }  else if (action === 'getAccessToken') {

    let restoredAccessToken = ""
    let restoredRefreshToken = ""

    await chrome.storage.local.get(['access_token', 'refresh_token'], function(data) {
      console.log("Got session data from chrome storage")
      if (data.access_token && data.refresh_token) {
        if(isJwtExpired(data.access_token)) {
          
        }
        else {
          console.log("restoring session")
          console.log(data.access_token)
          console.log(data.refresh_token)

          restoredAccessToken = data.access_token
          restoredRefreshToken = data.refresh_token

          response({data: {restoredAccessToken, restoredRefreshToken}, error: null});
        }
      }
    });

  } else if (action === 'signout') {
    const {error} = await supabase.auth.signOut()
    response({data: null, error});
  } else {
    response({data: null, error: 'Unknown action'});
  }
}

// @ts-ignore
browser.runtime.onMessage.addListener((msg, sender, response) => {
  handleMessage(msg, response);
  return true;
})