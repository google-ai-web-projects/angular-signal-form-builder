import { TestBed } from '@angular/core/testing';
import { FormToBodyMapperService } from './form-to-body-mapper.service';
import { ExpressionEvaluatorService } from './expression-evaluator.service';

describe('FormToBodyMapperService', () => {
  let service: FormToBodyMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormToBodyMapperService, ExpressionEvaluatorService],
    });
    service = TestBed.inject(FormToBodyMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('resolvePath and resolveValue', () => {
    const formValues = {
      username: 'johndoe',
      age: 30,
      isActive: true,
      address: {
        city: 'Austin',
        zip: '78701',
      },
      tags: ['developer', 'angular'],
      items: [
        { id: 101, name: 'Laptop' },
        { id: 102, name: 'Phone' },
      ],
    };

    it('should resolve flat fields with or without values. prefix', () => {
      expect(service.resolveValue(formValues, 'username')).toBe('johndoe');
      expect(service.resolveValue(formValues, 'values.username')).toBe('johndoe');
      expect(service.resolveValue(formValues, '{values.username}')).toBe('johndoe');
      expect(service.resolveValue(formValues, '{username}')).toBe('johndoe');
      expect(service.resolveValue(formValues, 'form.values.username')).toBe('johndoe');
    });

    it('should resolve nested dot-notation paths', () => {
      expect(service.resolveValue(formValues, 'address.city')).toBe('Austin');
      expect(service.resolveValue(formValues, 'values.address.city')).toBe('Austin');
      expect(service.resolveValue(formValues, '{values.address.city}')).toBe('Austin');
    });

    it('should resolve array indices using dot or bracket notation', () => {
      expect(service.resolveValue(formValues, 'tags.0')).toBe('developer');
      expect(service.resolveValue(formValues, 'values.tags[1]')).toBe('angular');
      expect(service.resolveValue(formValues, 'items[0].name')).toBe('Laptop');
      expect(service.resolveValue(formValues, '{values.items[1].id}')).toBe(102);
    });

    it('should return undefined for non-existent paths', () => {
      expect(service.resolveValue(formValues, 'nonExistent')).toBeUndefined();
      expect(service.resolveValue(formValues, 'values.address.country')).toBeUndefined();
    });
  });

  describe('substituteValue with Type Preservation', () => {
    const formValues = {
      username: 'alice',
      age: 28,
      isVerified: true,
      scores: [95, 88, 76],
      metadata: { role: 'admin', team: 'frontend' },
      nullableField: null,
    };

    it('should preserve number types for pure placeholders and direct references', () => {
      const fromPlaceholder = service.substituteValue('{values.age}', formValues);
      expect(fromPlaceholder).toBe(28);
      expect(typeof fromPlaceholder).toBe('number');

      const fromDirectRef = service.substituteValue('values.age', formValues);
      expect(fromDirectRef).toBe(28);
      expect(typeof fromDirectRef).toBe('number');
    });

    it('should preserve boolean types', () => {
      expect(service.substituteValue('{values.isVerified}', formValues)).toBe(true);
      expect(service.substituteValue('values.isVerified', formValues)).toBe(true);
    });

    it('should preserve array and object references', () => {
      expect(service.substituteValue('{values.scores}', formValues)).toEqual([95, 88, 76]);
      expect(service.substituteValue('values.metadata', formValues)).toEqual({
        role: 'admin',
        team: 'frontend',
      });
    });

    it('should perform string interpolation for embedded placeholders', () => {
      const result = service.substituteValue('User {values.username} is {values.age} years old', formValues);
      expect(result).toBe('User alice is 28 years old');
    });

    it('should gracefully handle missing fields with warnings', () => {
      const warnings: string[] = [];
      const res = service.substituteValue('{values.missingField}', formValues, warnings);
      expect(res).toBeNull();
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('missingField');
    });
  });

  describe('mapBody', () => {
    const formValues = {
      username: 'bobby',
      age: 42,
      profile: {
        city: 'Seattle',
        department: 'Engineering',
      },
      skills: ['TypeScript', 'Angular'],
    };

    it('should map a standard JSON string with placeholders and direct references', () => {
      const jsonTemplate = JSON.stringify({
        user: '{values.username}',
        userAge: 'values.age',
        location: {
          city: '{values.profile.city}',
        },
        skillList: 'values.skills',
        message: 'Welcome {values.username} to {values.profile.city}',
      });

      const { payload, warnings, errors } = service.mapBody(jsonTemplate, formValues);

      expect(errors.length).toBe(0);
      expect(payload).toEqual({
        user: 'bobby',
        userAge: 42,
        location: {
          city: 'Seattle',
        },
        skillList: ['TypeScript', 'Angular'],
        message: 'Welcome bobby to Seattle',
      });
    });

    it('should evaluate JS object notation expressions', () => {
      const jsTemplate = `{\n  "email": values.username + "@example.com",\n  "city": values.profile.city\n}`;
      const { payload } = service.mapBody(jsTemplate, formValues);

      expect(payload).toEqual({
        email: 'bobby@example.com',
        city: 'Seattle',
      });
    });

    it('should handle null or empty body mapping', () => {
      expect(service.mapBody(null, formValues).payload).toBeNull();
      expect(service.mapBody('', formValues).payload).toBeNull();
      expect(service.mapBody('   ', formValues).payload).toBeNull();
    });
  });

  describe('applyPayloadMappings and applyServiceParams', () => {
    const formValues = {
      account: {
        email: 'dev@test.com',
      },
      authToken: 'xyz-token-123',
    };

    it('should deep set payloadMappings into target paths', () => {
      const base = { existing: true };
      const mappings = [
        { formFieldId: 'values.account.email', targetPayloadPath: 'auth.credentials.email' },
        { formFieldId: 'authToken', targetPayloadPath: 'auth.token' },
      ];

      const result = service.applyPayloadMappings(base, mappings, formValues);
      expect(result).toEqual({
        existing: true,
        auth: {
          credentials: {
            email: 'dev@test.com',
          },
          token: 'xyz-token-123',
        },
      });
    });

    it('should apply serviceParams with type body', () => {
      const base = { id: 1 };
      const params = [
        { key: 'user.email', type: 'body' as const, value: 'values.account.email', valueSource: 'field' as const },
        { key: 'meta.staticFlag', type: 'body' as const, value: 'STATIC_VAL', valueSource: 'static' as const },
        { key: 'queryParam', type: 'query' as const, value: 'ignoreMe', valueSource: 'static' as const },
      ];

      const result = service.applyServiceParams(base, params, formValues);
      expect(result).toEqual({
        id: 1,
        user: {
          email: 'dev@test.com',
        },
        meta: {
          staticFlag: 'STATIC_VAL',
        },
      });
    });
  });
});
