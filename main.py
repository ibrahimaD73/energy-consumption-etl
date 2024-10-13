import pandas as pd
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error
from math import sqrt
import json
from flask import Flask, send_from_directory, jsonify
from loguru import logger

app = Flask(__name__, static_folder='static')

# Configuration des logs
logger.add("debug.log", rotation="500 MB")

def load_and_prepare_data(file_path):
    logger.info(f"Chargement des données depuis {file_path}")
    df = pd.read_csv(file_path, sep=';', parse_dates=['Date'], dayfirst=True)
    df['Date'] = pd.to_datetime(df['Date'], format='%Y-%m')
    df['Valeur (TWh)'] = df['Valeur (TWh)'].str.replace(',', '.').astype(float)
    logger.debug(f"Données chargées : {df.shape[0]} lignes, {df.shape[1]} colonnes")
    return df

def deseasonalize(series):
    logger.info("Désaisonnalisation des données")
    decomposition = seasonal_decompose(series, model='additive', period=12)
    return series - decomposition.seasonal

def make_stationary(series):
    logger.info("Transformation des données en série stationnaire")
    return series.diff().dropna()

def arima_forecast(series, order, n_periods=24):
    logger.info(f"Prévision ARIMA avec ordre {order} pour {n_periods} périodes")
    model = ARIMA(series, order=order)
    results = model.fit()
    return results.forecast(steps=n_periods)

def process_series(series, name):
    logger.info(f"Traitement de la série {name}")
    
    deseasonalized = deseasonalize(series)
    stationary = make_stationary(deseasonalized)
    
    order = (1, 1, 1)  # Ordre ARIMA simplifié
    forecast = arima_forecast(stationary, order)
    
    # Inverser la différenciation et ajouter la composante saisonnière
    last_season = series.iloc[-12:] - deseasonalized.iloc[-12:]
    forecast_reseasonalized = forecast.cumsum() + deseasonalized.iloc[-1]
    for i in range(len(forecast)):
        forecast_reseasonalized.iloc[i] += last_season.iloc[i % 12]
    
    rmse = sqrt(mean_squared_error(series[-12:], forecast_reseasonalized[:12]))
    logger.debug(f"RMSE pour {name}: {rmse}")
    
    return forecast_reseasonalized, rmse

def analyze_data():
    logger.info("Début de l'analyse des données")
    df = load_and_prepare_data('Evolution_de_la_consommation.csv')
    
    df_corrigee = df[df['Filière'] == 'Consommation corrigée'].set_index('Date')['Valeur (TWh)']
    df_brute = df[df['Filière'] == 'Consommation brute'].set_index('Date')['Valeur (TWh)']

    results = {}
    for name, series in [('Corrigée', df_corrigee), ('Brute', df_brute)]:
        forecast, rmse = process_series(series, name)
        results[name] = {
            'series': series,
            'forecast': forecast,
            'rmse': rmse
        }

    json_data = {
        'dates': df_corrigee.index.strftime('%Y-%m-%d').tolist(),
        'corrigee': df_corrigee.values.tolist(),
        'brute': df_brute.values.tolist(),
        'forecast_dates': pd.date_range(start=df_corrigee.index[-1], periods=25, freq='ME')[1:].strftime('%Y-%m-%d').tolist(),
        'forecast_corrigee': results['Corrigée']['forecast'].tolist(),
        'forecast_brute': results['Brute']['forecast'].tolist(),
        'rmse_corrigee': results['Corrigée']['rmse'],
        'rmse_brute': results['Brute']['rmse']
    }

    logger.info("Analyse des données terminée")
    logger.debug(f"Taille des données JSON : {len(json.dumps(json_data))} caractères")
    return json_data

@app.route('/')
def index():
    logger.info("Requête reçue pour la page d'accueil")
    return send_from_directory('.', 'index.html')

@app.route('/data_for_dashboard.json')
def get_data():
    logger.info("Requête reçue pour les données du dashboard")
    try:
        dashboard_data = analyze_data()
        logger.info("Données du dashboard générées avec succès")
        return jsonify(dashboard_data)
    except (IOError, ValueError, KeyError) as e:
        logger.error(f"Erreur lors de la génération des données du dashboard: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Démarrage de l'application Flask sur le port 7000")
    app.run(host='0.0.0.0', port=7000, debug=True)