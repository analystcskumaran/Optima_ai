import logging

logging.basicConfig(filename='optima.log', level=logging.INFO, format='%(asctime)s - %(message)s')

def log_event(message):
    logging.info(message)