(ns telepaint.core
  (:use [compojure.core :only (defroutes GET POST)]
        ring.util.response
        ring.middleware.cors
        org.httpkit.server
        clojure.pprint)
  (:require [compojure.route :as route]
            [compojure.handler :as handler]
            [ring.util.response :refer [redirect]]
            [ring.middleware.reload :as reload]
            [cheshire.core :refer :all]))

(def clients (atom {}))
(def host-set (atom false))
(def host-con (atom {}))

(defn tp-setup [con tp-req]
  (let [set @host-set]
    (when (not set)
      (do (reset! host-set true)
          (reset! host-con con)
          (send! con
                 (generate-string {"method" "setup", "data" true}))))
    (when set
      (send! con
             (generate-string {"method" "setup", "data" false})))))


(defn tp-update-host [con tp-req]
  (send! @host-con (generate-string
                    {"method" "update-host",
                     "data" (tp-req "data")})))

(defn tp-get-host-canvas [con tp-req]
  (send! @host-con (generate-string
                    {"method" "canvas"
                     "data" (tp-req "data")})))

(defn tp-inform-subs [con tp-req]
  (doseq [client @clients]
    (send! (key client) (generate-string
                         {"method" "copy-canvas",
                          "data" (tp-req "data")}))))

(defn method [tp-req]
  (get tp-req "method"))

(defn tp-on-close [con status]
  (swap! clients dissoc con)
  (when (identical? con @host-con)
    (do
      (reset! host-set false)
      (pprint (count @clients))
      (when (>= (count @clients) 1)
        ;; just pick the next one and designate as host
        (let [first-client (key (first @clients))]
          (reset! host-con first-client)
          (tp-setup first-client status))))
    (println con " disconnected. status: " status)))

(defn tp-on-receive [con data]
  (let [tpreq (parse-string data)]
    (condp = (method tpreq)
      "update-host" (tp-update-host con tpreq)
      "update-subs" (tp-get-host-canvas con tpreq)
      "host-canvas" (tp-inform-subs con tpreq)
      "setup" (tp-setup con tpreq)
      :else "no method")))

(defn ws
  [req]
  (with-channel req con
    (swap! clients assoc con true)
    (println con " connected")
    (on-close con (partial tp-on-close con))
    (on-receive con (partial tp-on-receive con))))

(defroutes routes
  (GET "/intellipaint" [] ws)
  (GET "/" [] (redirect "/index.html"))
  (route/resources "/"))

(def application (-> (handler/site routes)
                     reload/wrap-reload
                     (wrap-cors
                      :access-control-allow-origin #".+")))

(defn -main [& args]
  (let [port (Integer/parseInt
              (or (System/getenv "PORT") "8080"))]
    (run-server application {:port port :join? false})
    (println "server started")))
