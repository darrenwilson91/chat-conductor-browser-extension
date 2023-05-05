import browser from "webextension-polyfill";
//import supabase from './src/supabase_client';
import { createClient } from '@supabase/supabase-js'

type Message = {
  action: 'fetch' | 'getSession' | 'signout',
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

const supabaseUrl = 'https://fejgqerwrcmnqqhgmwgh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlamdxZXJ3cmNtbnFxaGdtd2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODMwMDM0ODYsImV4cCI6MTk5ODU3OTQ4Nn0.ex_M9R2CY05r64kr9wvXetmOGN7hS8NDmFheoGNpm0w';

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
  } else {
    console.log("User not logged in");

    // Reset the global session and user data
    currentSession = null;
    currentUser = null;
  }
});


type ResponseCallback = (data: any) => void

async function handleMessage({action, value}: Message, response: ResponseCallback) {
  if (action === 'completion') {

    const session = currentSession.access_token;

    const apiURL = 'https://fejgqerwrcmnqqhgmwgh.functions.supabase.co/completion';
    const requestOptions = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session,
      },
      body: JSON.stringify({ humanPrompt: "example prompt" })
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

    /*console.log("current session")
    console.log(currentSession)
    await supabase.auth.setSession(currentSession)

    console.log("session from completion:")
    console.log(await supabase.auth.getSession())

    
    const { data, error } = await supabase.from('users').select('*')
    if (error){
      console.log(error)
      throw error
    }

    console.log("fetched from users")
    console.log(data)

    
    const { data: completionData, error: completionError } = await supabase.functions.invoke('completion', {
      body: { humanPrompt: value.humanPrompt }
    })

    console.log('completionData', completionData)*/

    //response({ data: completionData.content, error: completionError })
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