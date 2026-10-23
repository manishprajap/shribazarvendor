import React, { useEffect, useState } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useHistory } from 'react-router-dom';
import Home from './pages/Home';
import ProductsPage from './pages/Products';
import ProductAdd from './pages/ProductAdd';
import Profile from './pages/profile';
import Footer from './components/footer';
import 'react-toastify/dist/ReactToastify.css';
import '@ionic/react/css/core.css';
import OrdersPage from './pages/OrderPage';
import Privacy from './pages/Privacy';
import Terms from './pages/terms';
import DeliveryPartnerRegister from './pages/DeliveryPartnerRegister';
import DeliveryPartnersPage from './pages/DeliveryPartnersPage';
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import { apiPost } from './api';
import PackerRegister from './pages/PackerRegister';
import PackerList from './pages/PackerList';
import { NewOrderAlertProvider } from './contexts/NewOrderAlertContext';
import GlobalNewOrderBanner from './contexts/GlobalNewOrderBanner';

setupIonicReact();

let pushInitStarted = false;
let fcmAlreadySynced = false;

const mapPlatformForBackend = (platform: string): string => {
  if (platform === 'android' || platform === 'ios') return 'mobile';
  if (platform === 'web') return 'web';
  return 'unknown';
};

const syncFcmTokenToServer = async (): Promise<boolean> => {
  if (fcmAlreadySynced) return true;

  const authToken = localStorage.getItem('auth_token');
  const fcmToken = localStorage.getItem('fcmToken');

  if (!authToken || !fcmToken) {
    return false;
  }

  const rawPlatform = localStorage.getItem('fcm_platform') || Capacitor.getPlatform();

  try {
    await apiPost('/save-fcm-token', {
      fcm_token: fcmToken,
      platform: mapPlatformForBackend(rawPlatform),
    });
    console.log('✅ FCM token synced to server');
    fcmAlreadySynced = true;
    return true;
  } catch (err) {
    console.error('❌ FCM token sync failed:', err);
    return false;
  }
};

const startAuthTokenPoll = () => {
  let attempts = 0;
  const maxAttempts = 100; // ~5 minutes @ 3s interval
  const intervalId = setInterval(async () => {
    attempts++;
    const synced = await syncFcmTokenToServer();
    if (synced || attempts >= maxAttempts) {
      clearInterval(intervalId);
    }
  }, 3000);
};

// Ensure local notification permission from a single centralized utility
const ensureLocalNotificationPermission = async (): Promise<boolean> => {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') return true;

    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch (err) {
    console.error('LocalNotifications permission error:', err);
    return false;
  }
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  // FCM Push registration — App-level, guaranteed single-run
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not a native platform — FCM token skip.');
      return;
    }

    // Prevent duplicate registration if this effect fires more than once
    if (pushInitStarted) {
      console.log('Push init already started — skipping duplicate run.');
      return;
    }
    pushInitStarted = true;

    let registrationListenerHandle: any;
    let errorListenerHandle: any;
    let receivedListenerHandle: any;
    let actionListenerHandle: any;

    const attachListenersAndRegister = async () => {
      try {
        registrationListenerHandle = await PushNotifications.addListener(
          'registration',
          async (token: Token) => {
            console.log('✅ FCM Token received:', token.value);
            const platform = Capacitor.getPlatform();
            localStorage.setItem('fcmToken', token.value);
            localStorage.setItem('fcm_platform', platform);

            const synced = await syncFcmTokenToServer();
            if (!synced) {
              console.log('Auth token not found yet — starting authentication polling...');
              startAuthTokenPoll();
            }
          }
        );

        errorListenerHandle = await PushNotifications.addListener(
          'registrationError',
          (err: any) => {
            console.error('❌ FCM Registration Error:', JSON.stringify(err));
          }
        );

        receivedListenerHandle = await PushNotifications.addListener(
          'pushNotificationReceived',
          async (notification: PushNotificationSchema) => {
            console.log('📩 Push received (foreground):', notification);
            const title = notification.title || 'ShriBazar';
            const body = notification.body || '';
            toast.info(`${title}: ${body}`);
            const hasPermission = await ensureLocalNotificationPermission();
            if (hasPermission) {
              try {
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      id: Date.now() % 2147483647, // 32-bit int range
                      title,
                      body,
                      extra: notification.data,
                    },
                  ],
                });
              } catch (err) {
                console.error('LocalNotifications.schedule error:', err);
              }
            }
          }
        );

        // User tapped the notification (opening the app from background/killed state)
        actionListenerHandle = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            console.log('👉 Push action performed:', action);
            const data = action.notification?.data as Record<string, string> | undefined;

            if (!data) return;

            switch (data.type) {
              case 'new_order':
              case 'order_status':
                if (data.order_id) {
                  history.push(`/orders?highlight=${data.order_id}`);
                } else {
                  history.push('/orders');
                }
                break;
              case 'delivery_assigned':
                if (data.order_id) {
                  history.push(`/orders?highlight=${data.order_id}`);
                } else {
                  history.push('/orders');
                }
                break;
              default:
                history.push('/home');
            }
          }
        );

        // Permission check
        const permStatus = await PushNotifications.checkPermissions();
        console.log('Push permission status:', permStatus);

        let finalStatus = permStatus;
        if (permStatus.receive !== 'granted') {
          finalStatus = await PushNotifications.requestPermissions();
          console.log('Push permission requested:', finalStatus);
        }

        if (finalStatus.receive !== 'granted') {
          console.log('Push permission denied by user');
          return;
        }
        await ensureLocalNotificationPermission();
        await PushNotifications.register();
        console.log('PushNotifications.register() called');
      } catch (err) {
        console.error('Error during push registration setup:', err);
        pushInitStarted = false; // allow retry on genuine failure
      }
    };

    attachListenersAndRegister();

    return () => {
      registrationListenerHandle?.remove?.();
      errorListenerHandle?.remove?.();
      receivedListenerHandle?.remove?.();
      actionListenerHandle?.remove?.();
    };
  }, [history]);

  useEffect(() => {
    if (isLoggedIn) {
      syncFcmTokenToServer();
    }
  }, [isLoggedIn]);

  if (showSplash) {
    return (
      <IonApp>
        <SplashScreen onDone={() => setShowSplash(false)} />
      </IonApp>
    );
  }

  if (isLoggedIn === null) return null;

  return (
    <IonApp>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <NewOrderAlertProvider enabled={!!isLoggedIn}>
        <GlobalNewOrderBanner />
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/login" component={Login} />
            <Route exact path="/home" component={Home} />
            <Route exact path="/product-list" component={ProductsPage} />
            <Route exact path="/product-add" component={ProductAdd} />
            <Route exact path="/profile" component={Profile} />
            <Route exact path="/orders" component={OrdersPage} />
            <Route exact path="/assign-delivery" component={DeliveryPartnersPage} />
            <Route exact path="/onboard-rider" component={DeliveryPartnerRegister} />

            <Route exact path="/packers/new" component={PackerRegister} />
            <Route exact path="/packers/:id/edit" component={PackerRegister} />
            <Route exact path="/packers/:id" component={PackerRegister} />
            <Route exact path="/packers" component={PackerList} />

            <Route exact path="/privacy" component={Privacy} />
            <Route exact path="/terms" component={Terms} />

            <Route exact path="/" render={() =>
              <Redirect to={isLoggedIn ? '/home' : '/login'} />
            } />

            <Route render={() =>
              <Redirect to={isLoggedIn ? '/home' : '/login'} />
            } />

          </IonRouterOutlet>
          <Footer />
        </IonReactRouter>
      </NewOrderAlertProvider>
    </IonApp>
  );
};

export default App;