#!/usr/bin/env python3
"""Build curated Fighter facts from decrypted Lua/config and English language JSON.
Usage: python3 tools/build_fighter_data.py /path/to/decrypted-sources
Raw APKs, Lua files and complete language tables remain outside this repository.
"""
import json
import sys
from pathlib import Path
from lua_tables import load

ROOT = Path(__file__).resolve().parents[1]

def main(src):
    src = Path(src)
    lang = {r['id']: r['en'] for f in src.glob('lang_*_en.json')
            for r in json.loads(f.read_text())['datas']}
    tables = {n: load(src / (n + '.lua'), n) for n in (
        'UavLevel', 'UavComponent', 'UavAdvance', 'UavModuleStar',
        'UavModuleSynthesis', 'UavAdvanceIncreaseSkill', 'DefineBenefit', 'Item')}
    def benefits(rows):
        return [[r['Type'], r['Value']] for r in rows]
    def icon(name):
        return '../assets/fighter/' + name + '.webp'
    items = tables['Item']
    data = {'source': {'client': 'v1.30.07', 'catalog': 'P1_V202609071132',
        'tables': list(tables), 'validation': 'User screenshots dated 2026-10-05: Lv.95 Stage 3/5 and six components.',
        'rules': ['Stage shown = phase - 1 for key upgrades.',
                  'Costs belong to the current UavLevel row, not the destination.',
                  'Normal-level budget assumes no bonus progress and no cross-level carry.',
                  'Component bonuses are summed by benefit type, not by screen order.',
                  'Base conversion uses convertBenefit; extra Fighter stats use uavConv / 10000.']},
        'levels': [], 'components': {}, 'slots': [], 'evolution': {},
        'modules': {}, 'benefits': {}, 'resources': {}}
    for r in tables['UavLevel'].values():
        data['levels'].append({k: r[k] for k in ('id', 'level', 'phase', 'power',
            'progressTotal', 'progressAdd', 'bonusCondition', 'bonusRate', 'multipleExp', 'cost', 'uavConv')})
        data['levels'][-1].update(benefits=benefits(r['levelBenefit']), converted=benefits(r['convertBenefit']))
    data['levels'].sort(key=lambda r: r['id'])
    for r in tables['UavComponent'].values():
        data['components'][r['id']] = {k: r[k] for k in (
            'id', 'slot', 'level', 'expPercentage', 'exp', 'maxExp', 'power', 'costCount', 'nextLevelId', 'provideExp')}
        data['components'][r['id']].update(benefits=benefits(r['componentBenefit']), icon=icon(r['icon']))
    for slot in range(6):
        r = next(r for r in tables['UavComponent'].values() if r['slot'] == slot)
        data['slots'].append({'slot': slot, 'name': lang[r['name']]})
    for r in tables['UavAdvance'].values():
        data['evolution'][r['id']] = {k: r[k] for k in ('id', 'phase', 'power', 'progressTotal', 'increaseLevel')}
        data['evolution'][r['id']]['benefits'] = benefits(r['Benefit'])
    for r in tables['UavModuleSynthesis'].values():
        item = items[r['medalId']]
        stars = sorted((s for s in tables['UavModuleStar'].values() if s['moduleId'] == r['id']), key=lambda s: s['starLevel'])
        data['modules'][r['id']] = {'id': r['id'], 'camp': r['campType'], 'slot': r['moduleType'],
            'name': lang[item['name']], 'icon': icon(item['icon']), 'quality': item['quality'],
            'type': lang['Wingman_Skill_Type_' + str(r['moduleType'])],
            'synthesis': r['cost'], 'building': r['buidingId'], 'buildingLevel': r['buidingLV'],
            'stars': {s['starLevel']: {'power': s['combatPower'], 'copies': s['starNumber'],
                'template': lang[s['skillDes']], 'args': [s['skillDesParam1'], s['skillDesParam2']]}
                for s in stars},
            'amplification': {s['increaseLevel']: {'power': s['combat_power'],
                'args': [s['increaseSkillUpParam1'], s['increaseSkillUpParam2']]}
                for s in tables['UavAdvanceIncreaseSkill'].values() if s['moduleId'] == r['id']}}
    for id in ('item_drone_data', 'item_drone_part'):
        item = items[id]
        data['resources'][id] = {'name': lang[item['name']], 'icon': icon(item['icon'])}
    types = set(t for c in data['components'].values() for t, _ in c['benefits'])
    types.update(t for r in data['levels'] for key in ('benefits', 'converted') for t, _ in r[key])
    for t in sorted(types):
        r = tables['DefineBenefit'][t]
        data['benefits'][t] = {'name': lang[r['name']], 'percent': r['paramType'] == 1}
    (ROOT / 'data/fighter.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
    print('Built', len(data['levels']), 'level/stage states,', len(data['components']), 'component states,', len(data['modules']), 'wingman chips')

if __name__ == '__main__':
    main(sys.argv[1])
