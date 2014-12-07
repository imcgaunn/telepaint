(defproject telepaint "0.1.0-SNAPSHOT"
  :description "collaborative painting thing"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [cheshire "5.2.0"]
                 [ring/ring-devel "1.1.8"]
                 [http-kit "2.0.0"]
                 [compojure "1.1.5"]
                 [ring-cors "0.1.0"]]
  :main telepaint.core
  :min-lein-version "2.0.0")
