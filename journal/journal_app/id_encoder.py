import random

class IdEncoder():
	LOWER = 'bcdfghjklmnpqrstvwxyz'
	UPPER = LOWER.upper()
	NUMS = '23456789'
	ALPHABET = LOWER + UPPER + NUMS

	base = len(ALPHABET)
	MIN_LENGTH = 5
	@classmethod
	def int_to_string(cls, n):
		num = n + pow(cls.base, cls.MIN_LENGTH - 1)
		s = ''
		while num > 0:
			i = num % cls.base
			s = cls.ALPHABET[i:i+1] + s
			num /= cls.base
		return s

	@classmethod
	def string_to_int(cls, s):
		n = 0
		for i in range(len(s)):
			n += cls.ALPHABET.index(s[i]) * pow(cls.base, len(s) - 1 - i)
		return n - pow(cls.base, cls.MIN_LENGTH - 1)

	@classmethod
	def test(cls):
		max_r = 10000000
		trials = 1000000
		cases = []
		for i in range(trials):
			cases.append(random.randrange(0, max_r))
		cases.append(0) # edge case
		cases.append(max_r) # edge case
		for n in cases:
			if (cls.string_to_int(cls.int_to_string(n)) != n):
				raise Exception("IdStringGen test failed.")
		return True
