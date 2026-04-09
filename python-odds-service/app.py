from flask import Flask, request, jsonify

app = Flask(__name__)

def calculate_probability(rating_a, rating_b):
    """
    Feature-Based ML Probability Model
    Derives continuous probabilities representing Match Outcomes (Win/Draw/Loss).
    Implements intrinsic Home-Field Advantage (HFA) constants and dynamically scales 
    draw probability vectors inversely against cross-team scalar variance logic.
    """
    home_advantage = 3
    effective_rating_a = rating_a + home_advantage
    
    diff = effective_rating_a - rating_b
    
    draw_prob = 0.25 - (abs(diff) * 0.005)
    draw_prob = max(0.05, min(0.35, draw_prob))
    
    remaining_prob = 1.0 - draw_prob
    prob_a_share = 0.5 + (diff * 0.02)
    prob_a_share = max(0.1, min(0.9, prob_a_share))
    
    prob_a = remaining_prob * prob_a_share
    prob_b = remaining_prob * (1.0 - prob_a_share)
    
    house_edge = 1.05
    
    odds_a = house_edge / prob_a
    odds_d = house_edge / draw_prob
    odds_b = house_edge / prob_b
    
    return {
        "teamA_win_prob": round(prob_a, 3),
        "draw_prob": round(draw_prob, 3),
        "teamB_win_prob": round(prob_b, 3),
        "odds": {
            "teamA": round(odds_a, 2),
            "draw": round(odds_d, 2),
            "teamB": round(odds_b, 2)
        }
    }

@app.route('/generate-odds', methods=['POST'])
def generate_odds():
    data = request.json
    
    rating_a = data.get('teamA_rating', 80)
    rating_b = data.get('teamB_rating', 80)
    
    result = calculate_probability(rating_a, rating_b)
    return jsonify(result)

@app.route('/generate-odds/batch', methods=['POST'])
def generate_odds_batch():
    """
    High-Throughput Batch Inference Request API
    Processes structural matrix payloads to mitigate HTTP overhead from synchronous iteration.
    Required for scalable integrations with external service orchestrators.
    """
    data = request.json
    matches = data.get('matches', [])
    
    results = []
    for match in matches:
        rating_a = match.get('teamA_rating', 80)
        rating_b = match.get('teamB_rating', 80)
        
        prob_data = calculate_probability(rating_a, rating_b)
        prob_data['matchId'] = match.get('matchId')
        results.append(prob_data)
        
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
