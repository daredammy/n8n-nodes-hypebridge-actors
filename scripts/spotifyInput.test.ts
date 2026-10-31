import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertApifyToN8n } from './actorSchemaConverter';
import { buildActorInput } from '../nodes/ApifySpotifyPlayCountCuratorScraper/ApifySpotifyPlayCountCuratorScraper.properties';
test('optional booleans preserve automatic, true and false', () => {
    const fields = convertApifyToN8n({type:'object',properties:{includeTracks:{title:'Tracks',type:'boolean'},curatorContacts:{title:'Contacts',type:'boolean',default:false}}} as any);
    assert.equal(fields[0].type,'options'); assert.equal(fields[0].default,''); assert.equal(fields[1].type,'boolean');
    for (const value of ['',true,false]) {
        const context = {getNodeParameter:(name: string,_index: number,fallback: unknown) => name === 'includeTracks' ? value : fallback} as any;
        const input = buildActorInput(context,0,{});
        if (value === '') assert.equal('includeTracks' in input,false); else assert.equal(input.includeTracks,value);
    }
});
